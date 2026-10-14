#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {page,table,writeOut} from './lib/render.mjs';

export const reads={
 programs:'select * from programs order by name',
 members:'select id,number,name,status,enrolled_on,last_activity from members order by number',
 balances:'select * from member_balances order by number',
 expiring:'select * from expiring_points order by expires_on,number',
 dormant:"select number,name,available_points,last_activity from member_balances where status='active' and (last_activity is null or last_activity<current_date-90) order by number",
 'tier-review':'select number,name,qualifying_points,suggested_tier from tier_review order by number',
 rewards:'select r.id,p.name program,r.name,r.points,r.active from rewards r join programs p on p.id=r.program_id order by p.name,r.name',
 redemptions:'select * from reward_queue order by due_on,reference',
 compliance:'select * from compliance_checks order by number,rule',
 followups:'select n.id,m.number,m.name,n.note,n.due_on from notes n join members m on m.id=n.member_id where n.resolved_on is null order by n.due_on',
 activity:'select action,actor,detail,created_at from events order by created_at,id',
 attention:`select 'reward overdue' kind,reference item,name,due_on::text due from reward_queue where status in ('requested','approved') and due_on<current_date
 union all select 'member record check',number,name,rule from compliance_checks
 union all select 'points expire',reference,name,expires_on::text from expiring_points
 union all select 'follow-up overdue',m.number,m.name,n.due_on::text from notes n join members m on m.id=n.member_id where n.resolved_on is null and n.due_on<current_date order by kind,item`
};
export const commands=[...Object.keys(reads),'help','source-history','show','weekly-review','add-program','add-member','add-reward','earn','redeem','approve-reward','complete-reward','cancel-reward','review-member','log','resolve','import','export','draft-statement','draft-review'];
function required(o,k){if(typeof o[k]!=='string'||!o[k].trim())throw Error(`--${k} is required`);return o[k].trim();}
function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error(`Invalid date: ${v}`);return v;}
function integer(v){if(!/^\d+$/.test(String(v))||!Number.isSafeInteger(Number(v))||Number(v)<1||Number(v)>2147483647)throw Error('Points must be a positive whole number');return Number(v);}
const today=()=>new Date().toISOString().slice(0,10);
export async function match(db,entity,ref,program=null){
 if(!['programs','members','rewards','redemptions','notes'].includes(entity))throw Error('Invalid record type');
 const rows=await db.query(`select * from ${entity}`);
 const label=r=>entity==='redemptions'?r.reference:entity==='notes'?r.note:r.name;
 const pool=program?rows.filter(r=>r.program_id===program):rows;
 const value=String(ref).toLowerCase();
 const exact=pool.filter(r=>r.id.toLowerCase()===value||String(label(r)).toLowerCase()===value||String(r.number??'').toLowerCase()===value);
 const found=exact.length?exact:pool.filter(r=>r.id.toLowerCase().startsWith(value)||String(label(r)).toLowerCase().includes(value));
 if(found.length!==1)throw Error(found.length?`Ambiguous ${entity}:\n${found.map(r=>`${r.id}  ${r.number||''}  ${label(r)}`).join('\n')}`:`No ${entity} match: ${ref}`);
 return found[0];
}
async function event(db,action,actor,detail){await db.query('insert into events(action,actor,detail) values($1,$2,$3)',[action,actor,JSON.stringify(detail)]);}
async function transaction(db,fn,rollback=false){await db.exec('BEGIN');try{const result=await fn();await db.exec(rollback?'ROLLBACK':'COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}}
async function memberLock(db,o){const m=await match(db,'members',required(o,'member'));await db.query('select id from members where id=$1 for update',[m.id]);return (await db.query('select * from members where id=$1',[m.id]))[0];}

async function importMembers(db,o,actor){
 const rows=parseCsv(fs.readFileSync(path.resolve(required(o,'file')),'utf8'));
 if(!rows.length)throw Error('Empty import');
 const program=await match(db,'programs',required(o,'program'));
 const seen=new Set();let added=0,unchanged=0;
 for(const raw of rows){
  const source=pick(raw,'Id').trim(),number=pick(raw,'MembershipNumber').trim(),name=pick(raw,'Contact.Name','Account.Name','GroupName').trim()||number;
  const sourceProgram=pick(raw,'ProgramId','LoyaltyProgramId').trim();
  if(!source||!number||!sourceProgram)throw Error('Import needs Id, MembershipNumber and ProgramId');
  if(sourceProgram!==required(o,'source-program'))throw Error(`Source programme mismatch for ${number}`);
  if(seen.has(source))throw Error(`Duplicate source Id: ${source}`);seen.add(source);
  const status=pick(raw,'MemberStatus').trim().toLowerCase();if(!['active','inactive','merged'].includes(status))throw Error(`Unsupported MemberStatus: ${status}`);
  const enrolled=date(pick(raw,'EnrollmentDate'));if(enrolled>today())throw Error('Future enrolment');
  const last=pick(raw,'LastActivityDate')?date(pick(raw,'LastActivityDate')):null;
  if(last&&(last>today()||last<enrolled))throw Error('Invalid activity date');
  const promotion=pick(raw,'CanReceivePromotions').toLowerCase();if(promotion&&!['true','false'].includes(promotion))throw Error('CanReceivePromotions must be true or false');
  const existing=(await db.query('select * from members where source_id=$1',[source]))[0];
  if(existing){
   if(existing.program_id!==program.id||JSON.stringify(Object.entries(existing.source_data).sort())!==JSON.stringify(Object.entries(raw).sort()))throw Error(`Changed source ${source}; reconcile explicitly before reimporting`);
   unchanged++;continue;
  }
  await db.query('insert into members(program_id,source_id,number,name,status,enrolled_on,last_activity,promotions,source_data) values($1,$2,$3,$4,$5,$6,$7,$8,$9)',[program.id,source,number,name,status,enrolled,last,promotion==='true',JSON.stringify(raw)]);added++;
 }
 let archived=0;
 if(o['history-dir']){
  if(!fs.existsSync(path.resolve(o['history-dir']))||!fs.statSync(path.resolve(o['history-dir'])).isDirectory())throw Error('History directory does not exist');
  for(const object of ['LoyaltyMemberCurrency','LoyaltyLedger','TransactionJournal']){
   const file=path.join(path.resolve(o['history-dir']),object+'.csv');if(!fs.existsSync(file))continue;
   for(const raw of parseCsv(fs.readFileSync(file,'utf8'))){
    const id=pick(raw,'Id'),member=pick(raw,'LoyaltyMemberId','LoyaltyProgramMemberId','MemberId');
    if(!id||!member)throw Error(`${object} needs Id and the documented member reference`);
    const m=(await db.query('select id from members where source_id=$1 and program_id=$2',[member,program.id]))[0];
    if(!m)throw Error(`Unknown source member ${member}`);
    const old=(await db.query('select data from source_records where object_name=$1 and source_id=$2',[object,id]))[0];
    if(old){if(JSON.stringify(Object.entries(old.data).sort())!==JSON.stringify(Object.entries(raw).sort()))throw Error(`Changed source history ${id}`);continue;}
    await db.query('insert into source_records(member_id,object_name,source_id,data) values($1,$2,$3,$4)',[m.id,object,id,JSON.stringify(raw)]);archived++;
   }
  }
 }
 await event(db,'import',actor,{added,unchanged,source_program:o['source-program'],program:program.id});
 return {added,unchanged,archived,dry_run:Boolean(o['dry-run']),scope:'Members imported; optional point history preserved as source evidence, not posted balances.'};
}

export async function run(db,cmd,o={},args=[]){
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='help')return commands.map(command=>({command}));
 if(cmd==='weekly-review')return {balances:await run(db,'balances'),attention:await run(db,'attention'),tiers:await run(db,'tier-review')};
 if(cmd==='source-history'){const m=await match(db,'members',required(o,'member'));return db.query('select object_name,source_id,data from source_records where member_id=$1 order by object_name,source_id',[m.id]);}
 if(cmd==='show'){const m=await match(db,'members',required(o,'member'));return {member:m,balance:await db.query('select * from member_balances where id=$1',[m.id]),lots:await db.query('select * from lot_balances where member_id=$1 order by expires_on',[m.id]),redemptions:await db.query('select * from redemptions where member_id=$1',[m.id]),notes:await db.query('select * from notes where member_id=$1',[m.id])};}
 if(cmd==='export'){
  const data={format:'loyalty-program-v1',exported_at:new Date().toISOString()};
  await transaction(db,async()=>{for(const entity of ['programs','tiers','members','lots','rewards','redemptions','allocations','notes','events','source_records'])data[entity]=await db.query(`select * from ${entity} order by id`);});
  const file=path.resolve(required(o,'out'));fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n',{flag:'wx'});return {file};
 }
 if(cmd==='draft-statement'||cmd==='draft-review'){
  const data=cmd==='draft-statement'?await run(db,'show',o):await run(db,'weekly-review');
  const sections=Object.entries(data).map(([title,rows])=>({title,html:table(Array.isArray(rows)?rows:[rows])}));
  const file=writeOut('drafts',`${cmd}-${crypto.randomUUID()}`,page({title:cmd==='draft-statement'?'DRAFT member statement':'DRAFT weekly loyalty review',subtitle:'For operator review. Nothing sent.',sections}));return {file};
 }
 if(!commands.includes(cmd))throw Error(`Unknown command: ${cmd}. Use help.`);
 const actor=required(o,'actor');
 return transaction(db,async()=>{
  let result;
  if(cmd==='add-program')result=(await db.query('insert into programs(name,terms_ref) values($1,$2) returning *',[required(o,'name'),required(o,'terms')]))[0];
  else if(cmd==='add-member'){
   const p=await match(db,'programs',required(o,'program'));
   result=(await db.query('insert into members(program_id,number,name,privacy_review_due,retention_basis) values($1,$2,$3,$4,$5) returning *',[p.id,required(o,'number'),required(o,'name'),date(required(o,'review-due')),required(o,'basis')]))[0];
  }else if(cmd==='add-reward'){
   const p=await match(db,'programs',required(o,'program'));
   result=(await db.query('insert into rewards(program_id,name,points) values($1,$2,$3) returning *',[p.id,required(o,'name'),integer(required(o,'points'))]))[0];
  }else if(cmd==='earn'){
   const m=await memberLock(db,o);if(m.status!=='active')throw Error('Member is not active');
   const expires=date(required(o,'expires'));if(expires<today())throw Error('New points must not be expired');
   const terms=(await db.query('select terms_ref from programs where id=$1',[m.program_id]))[0].terms_ref;if(!terms)throw Error('Record programme terms before issuing points');
   result=(await db.query('insert into lots(member_id,reference,points,expires_on,actor,evidence) values($1,$2,$3,$4,$5,$6) returning *',[m.id,required(o,'reference'),integer(required(o,'points')),expires,actor,required(o,'evidence')]))[0];
   await db.query('update members set last_activity=current_date where id=$1',[m.id]);
  }else if(cmd==='redeem'){
   const m=await memberLock(db,o);if(m.status!=='active')throw Error('Member is not active');
   const reward=await match(db,'rewards',required(o,'reward'),m.program_id);if(!reward.active)throw Error('Reward is inactive');
   const lots=await db.query('select * from lot_balances where member_id=$1 and expires_on>=current_date and remaining>0 order by expires_on,earned_on,id',[m.id]);
   if(lots.reduce((n,l)=>n+l.remaining,0)<reward.points)throw Error('Insufficient unexpired points');
   result=(await db.query('insert into redemptions(member_id,reward_id,reference,points,requested_by,due_on) values($1,$2,$3,$4,$5,$6) returning *',[m.id,reward.id,required(o,'reference'),reward.points,actor,date(required(o,'due'))]))[0];
   let need=reward.points;for(const l of lots){if(!need)break;const take=Math.min(need,l.remaining);await db.query('insert into allocations(lot_id,redemption_id,points) values($1,$2,$3)',[l.id,result.id,take]);need-=take;}
   await db.query('update members set last_activity=current_date where id=$1',[m.id]);
  }else if(['approve-reward','complete-reward','cancel-reward'].includes(cmd)){
   const found=await match(db,'redemptions',required(o,'reference'));
   await db.query('select id from members where id=$1 for update',[found.member_id]);
   const r=(await db.query('select * from redemptions where id=$1 for update',[found.id]))[0];
   const evidence=required(o,'evidence');
   const status=cmd==='approve-reward'?'approved':cmd==='complete-reward'?'completed':'cancelled';
   if(cmd==='approve-reward'&&(r.status!=='requested'||r.requested_by.toLowerCase()===actor.toLowerCase()))throw Error('Approval needs a different reviewer and a requested reward');
   if(cmd==='complete-reward'&&r.status!=='approved')throw Error('Only approved rewards can be completed');
   if(cmd==='cancel-reward'&&!['requested','approved'].includes(r.status))throw Error('Only pending rewards can be cancelled');
   result=(await db.query('update redemptions set status=$2,evidence=$3,approved_by=case when $2=\'approved\' then $4 else approved_by end where id=$1 returning *',[r.id,status,evidence,actor]))[0];
  }else if(cmd==='review-member'){
   const m=await memberLock(db,o);const status=o.status||m.status;if(!['active','inactive','merged'].includes(status))throw Error('Invalid member status');
   const promotion=o.promotions===undefined?m.promotions:o.promotions==='true';if(o.promotions!==undefined&&!['true','false'].includes(o.promotions))throw Error('--promotions=true or false');
   const consent=o.consent===undefined?m.consent_ref:o.consent;
   if(promotion&&!consent)throw Error('Promotions need consent evidence');
   result=(await db.query('update members set privacy_review_due=$2,retention_basis=$3,status=$4,promotions=$5,consent_ref=$6 where id=$1 returning *',[m.id,date(required(o,'review-due')),required(o,'basis'),status,promotion,consent]))[0];
  }else if(cmd==='log'){
   const m=await match(db,'members',required(o,'member'));result=(await db.query('insert into notes(member_id,note,actor,due_on) values($1,$2,$3,$4) returning *',[m.id,required(o,'note'),actor,date(required(o,'due'))]))[0];
  }else if(cmd==='resolve'){
   const n=await match(db,'notes',required(o,'reference'));result=(await db.query('update notes set resolved_on=current_date,resolution=$2 where id=$1 and resolved_on is null returning *',[n.id,required(o,'evidence')]))[0];if(!result)throw Error('Follow-up already resolved');
  }else if(cmd==='import'){
   if(args[0]!=='salesforce-loyalty-management')throw Error('Use import salesforce-loyalty-management');
   return importMembers(db,o,actor);
  }
  await event(db,cmd,actor,{id:result.id,evidence:o.evidence||null});return result;
 },Boolean(o['dry-run']));
}
function format(value){
 if(!Array.isArray(value)){for(const [key,v] of Object.entries(value)){console.log(key+':');if(Array.isArray(v))format(v);else console.log(typeof v==='object'?JSON.stringify(v,null,2):v);}return;}
 if(!value.length){console.log('(none)');return;}
 const keys=Object.keys(value[0]);const cell=v=>typeof v==='object'&&v!==null?JSON.stringify(v):String(v??'');
 const widths=keys.map(k=>Math.min(50,Math.max(k.length,...value.map(r=>cell(r[k]).length))));
 console.log(keys.map((k,i)=>k.padEnd(widths[i])).join(' | '));console.log(widths.map(n=>'-'.repeat(n)).join('-+-'));
 for(const row of value)console.log(keys.map((k,i)=>cell(row[k]).replace(/\n/g,' ').slice(0,50).padEnd(widths[i])).join(' | '));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{const argv=process.argv.slice(2),o={},args=[];let cmd=argv.shift()||'help';if(cmd==='--help')cmd='help';for(const a of argv){if(a.startsWith('--')){const i=a.indexOf('=');o[i<0?a.slice(2):a.slice(2,i)]=i<0?true:a.slice(i+1);}else args.push(a);}db=await getDb();const result=await run(db,cmd,o,args);if(o.json)console.log(JSON.stringify(result,null,2));else format(result);}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
