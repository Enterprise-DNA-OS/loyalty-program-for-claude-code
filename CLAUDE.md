# Loyalty Program for Claude Code

Run the member and reward back office from a database. This is the fictional Harbour Rewards demo until the operator replaces the data. The aim is correct points, traceable rewards and a useful Monday review.

Read README.md and docs/replace-salesforce-loyalty-management.md before importing. Use one CLI: `npm run loyalty -- <command>`. Every command accepts --json. Never answer about records from memory.

## Routing

- /programs: `npm run loyalty -- programs`
- /members: `npm run loyalty -- members`
- /balances: `npm run loyalty -- balances`
- /expiring: `npm run loyalty -- expiring`
- /dormant: `npm run loyalty -- dormant`
- /tier-review: `npm run loyalty -- tier-review`
- /rewards: `npm run loyalty -- rewards`
- /redemptions: `npm run loyalty -- redemptions`
- /compliance: `npm run loyalty -- compliance`
- /followups: `npm run loyalty -- followups`
- /activity: `npm run loyalty -- activity`
- /attention: `npm run loyalty -- attention`
- /help: `npm run loyalty -- help`
- /source-history: `npm run loyalty -- source-history --member=SF001`
- /show: `npm run loyalty -- show --member=HR001`
- /weekly-review: `npm run loyalty -- weekly-review`
- /add-program: `npm run loyalty -- add-program --name="Our Rewards" --terms="Approved programme terms reference" --actor="Operator"`
- /add-member: `npm run loyalty -- add-member --program="Harbour Rewards" --number=NEW001 --name="Member name" --review-due=YYYY-MM-DD --basis="Membership administration" --actor="Operator"`
- /add-reward: `npm run loyalty -- add-reward --program="Harbour Rewards" --name="Workshop" --points=500 --actor="Operator"`
- /earn: `npm run loyalty -- earn --member=HR001 --points=100 --expires=YYYY-MM-DD --reference="Unique receipt reference" --evidence="Approved accrual evidence" --actor="Operator"`
- /redeem: `npm run loyalty -- redeem --member=HR001 --reward="Workshop place" --reference="Unique reward reference" --due=YYYY-MM-DD --actor="Operator"`
- /approve-reward: `npm run loyalty -- approve-reward --reference="Reward reference" --evidence="Reviewed request" --actor="Independent reviewer"`
- /complete-reward: `npm run loyalty -- complete-reward --reference="Reward reference" --evidence="Fulfilment record" --actor="Operator"`
- /cancel-reward: `npm run loyalty -- cancel-reward --reference="Reward reference" --evidence="Cancellation reason" --actor="Operator"`
- /review-member: `npm run loyalty -- review-member --member=HR001 --review-due=YYYY-MM-DD --basis="Retention purpose" --actor="Operator"`
- /log: `npm run loyalty -- log --member=HR001 --note="Follow-up required" --due=YYYY-MM-DD --actor="Operator"`
- /resolve: `npm run loyalty -- resolve --reference="Follow-up UUID" --evidence="Resolution reference" --actor="Operator"`
- /import: `npm run loyalty -- import salesforce-loyalty-management --file=imports/LoyaltyProgramMember.csv --program="Harbour Rewards" --source-program="Salesforce programme ID" --history-dir=imports --actor="Operator" --dry-run`
- /export: `npm run loyalty -- export --out=exports/records.json`
- /draft-statement: `npm run loyalty -- draft-statement --member=HR001`
- /draft-review: `npm run loyalty -- draft-review`

- /docs and /view: branded documents and reports.
- /customise: a tested migration for the operator's fields, tiers or rules.
- /new-view: a read-only report from existing records.

## Rules

Read the matching .claude/commands recipe. Read the member history before changing it. Never guess names, dates, points, consent or evidence. Partial references are supported, ambiguous names stop with a list. Every data mutation requires --actor and records an event. Actor labels are attribution, not authentication.

Points are whole-number non-cash programme units. Never process payments, gift cards or cash redemption. New lots require evidence and expiry. Rewards consume earliest-expiring available lots, reserve at request, need separate approval, and complete only when the operator reports fulfilment. Cancel only pending rewards. A cancelled reservation restores availability only while its original lot remains unexpired. There is no deletion or completed-reward reversal command.

Do not send, publish, modify customer systems or create a public service. HTML outputs are drafts and read-only reports. Do not write to Salesforce. Review privacy exceptions with the operator, never treat an empty compliance report as certification. Never run demo seed on a shared database.

Database migrations live in supabase/migrations/. Add a new numbered migration for a changed rule; do not edit applied migrations. Test on isolated data before an authorised production migration. Keep CLAUDE.md and AGENTS.md together. Use the same recipes with Claude Code, Codex, OpenCode or Cursor.
