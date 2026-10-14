# Loyalty Program for Claude Code

Keep member points, expiry dates and reward approvals in a database you own.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free MIT software. Install and try the fictional demo. | Your programme rules, imported records, reports and agreed connections. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |

[Get your version built](https://enterprisedna.co/omni/book?offer=replace-software&utm_medium=readme&utm_campaign=salesforce-loyalty-management) · [Instead of Salesforce Loyalty Management](https://enterprisedna.co/omni/instead-of/salesforce-loyalty-management)

## Start here

Node 20 or later. The local demo needs no database server.

```bash
npm install
npm run demo
npm run loyalty -- weekly-review
npm run view
npm run docs
```

Open the folder in Claude Code, Codex, OpenCode or Cursor. AGENTS.md points to CLAUDE.md and the same command recipes. PGlite keeps local records in .data/db. DATABASE_URL selects PostgreSQL. Shared deployments need controlled access and backups. Do not seed real data with the demo.

The fictional Harbour Rewards programme includes an overdue reward, expired points, points about to expire, dormant members and missing privacy evidence. Dates are relative to the first seed. Repeating seed preserves records.

## Weekly rituals

Review /expiring, /dormant, /redemptions, /tier-review and /compliance each week. /weekly-review combines balances, attention and tiers. /draft-statement produces member paperwork. /draft-review prepares the management review. Nothing sends.

31 CLI commands and 35 slash-command recipes. Every CLI command accepts --json. References accept case-insensitive names, member numbers or UUID prefixes. Ambiguous names list candidates and exit 1. Mutations require --actor. Use --dry-run for transactional previews.

- /programs: `programs`
- /members: `members`
- /balances: `balances`
- /expiring: `expiring`
- /dormant: `dormant`
- /tier-review: `tier-review`
- /rewards: `rewards`
- /redemptions: `redemptions`
- /compliance: `compliance`
- /followups: `followups`
- /activity: `activity`
- /attention: `attention`
- /help: `help`
- /source-history: `source-history --member=SF001`
- /show: `show --member=HR001`
- /weekly-review: `weekly-review`
- /add-program: `add-program --name="Our Rewards" --terms="Approved programme terms reference" --actor="Operator"`
- /add-member: `add-member --program="Harbour Rewards" --number=NEW001 --name="Member name" --review-due=YYYY-MM-DD --basis="Membership administration" --actor="Operator"`
- /add-reward: `add-reward --program="Harbour Rewards" --name="Workshop" --points=500 --actor="Operator"`
- /earn: `earn --member=HR001 --points=100 --expires=YYYY-MM-DD --reference="Unique receipt reference" --evidence="Approved accrual evidence" --actor="Operator"`
- /redeem: `redeem --member=HR001 --reward="Workshop place" --reference="Unique reward reference" --due=YYYY-MM-DD --actor="Operator"`
- /approve-reward: `approve-reward --reference="Reward reference" --evidence="Reviewed request" --actor="Independent reviewer"`
- /complete-reward: `complete-reward --reference="Reward reference" --evidence="Fulfilment record" --actor="Operator"`
- /cancel-reward: `cancel-reward --reference="Reward reference" --evidence="Cancellation reason" --actor="Operator"`
- /review-member: `review-member --member=HR001 --review-due=YYYY-MM-DD --basis="Retention purpose" --actor="Operator"`
- /log: `log --member=HR001 --note="Follow-up required" --due=YYYY-MM-DD --actor="Operator"`
- /resolve: `resolve --reference="Follow-up UUID" --evidence="Resolution reference" --actor="Operator"`
- /import: `import salesforce-loyalty-management --file=imports/LoyaltyProgramMember.csv --program="Harbour Rewards" --source-program="Salesforce programme ID" --history-dir=imports --actor="Operator" --dry-run`
- /export: `export --out=exports/records.json`
- /draft-statement: `draft-statement --member=HR001`
- /draft-review: `draft-review`

/docs, /view, /customise and /new-view cover paperwork, read-only reports and tested changes.

## Point and reward rules

Each earning is a dated lot with a unique reference and evidence. Points remain spendable through their expiry date in UTC. Requests consume the earliest-expiring available lots and reserve points immediately. A different actor approves the request. Completion records external fulfilment, it does not deliver a reward. Cancelling a pending request releases its allocation; an expired lot stays expired. Completed rewards cannot be cancelled by this CLI. Corrections require an agreed, tested migration and retained evidence.

Tiers are suggestions based on points earned in the last 365 days, excluding the boundary day. Redemption does not reduce qualifying points. The demo thresholds are Member 0, Silver 1000 and Gold 3000. They are example business rules, not Salesforce rules. /customise changes them through a migration. There is one whole-number, non-cash point unit per programme, no payment processing or gift-card balances.

## Ten questions answered today

These examples are supported by this build. They are not claims that Salesforce cannot answer them.

1. Which members have points expiring in the next 30 days? Run `expiring`.
2. Which inactive shoppers still hold spendable points? Run `dormant`.
3. Which reward requests are overdue? Run `attention`.
4. What can each member spend after pending rewards are reserved? Run `balances`.
5. Which members need a retention review? Run `compliance`.
6. Which promotion permissions lack supporting evidence? Run `compliance`.
7. Which tiers do rolling annual points suggest? Run `tier-review`.
8. Who recorded or approved a reward change? Run `activity`.
9. Which follow-ups remain open? Run `followups`.
10. What belongs in the Monday loyalty review? Run `weekly-review`.

## Bring your records

```bash
npm run loyalty -- import salesforce-loyalty-management --file=imports/LoyaltyProgramMember.csv --program="Harbour Rewards" --source-program="Your Salesforce programme ID" --history-dir=imports --actor="Your name" --dry-run
```

Remove --dry-run after reviewing the result. Members come across, including extra source columns. Optional LoyaltyMemberCurrency, LoyaltyLedger and TransactionJournal exports are retained as source evidence. They do not create spendable balances. Reconcile remaining lots, expiries and existing reward commitments before operational cutover. [Exact mapping and export steps](docs/replace-salesforce-loyalty-management.md).

## Documents and controls

Edit brand.json for your business name, logo and colours. npm run docs produces member statements and reward authorisation sheets. npm run view renders the week, expiry and controls reports. Open the HTML locally or print reviewed documents to PDF.

/compliance flags retention reviews, promotion permission evidence and missing programme terms. [Official sources and exact scope](docs/compliance.md). No legal certification, sends, member portal, checkout connector or live Salesforce connection is included. [What a front end adds](docs/why-no-front-end.md).

Actor names are not authenticated identities and database owners can edit history. Shared operation needs restricted database credentials, backups and an approval procedure. RLS is enabled with no public policies; use a trusted database owner for the CLI, never expose it as an anonymous endpoint.

## Your first hour: ten things to ask for

1. Put our name and logo on the statement.
2. Preview our member export.
3. Preserve the original point history for reconciliation.
4. Show points due to expire this month.
5. Find overdue reward requests.
6. Record a reviewed point earning with its expiry.
7. Draft a member statement for review.
8. Explain which promotion permissions lack evidence.
9. Set our tier thresholds with a tested migration.
10. Add our retention-review policy and a new report.

## Price and verification

Salesforce publishes Starter at US$20,000 per organisation per month, billed annually, equivalent to US$240,000 a year. This is a public USD list price, not an observed NZ or AU customer invoice. [Vendor pricing](https://www.salesforce.com/marketing/loyalty/pricing/), checked 14 October 2026. [Selection evidence](docs/research.md).

npm test creates isolated data, exercises all 31 commands, checks point arithmetic, expiry, approval states, import rollback and idempotency, history preservation, full exports, escaped HTML and rendering. CI runs Node 20/22 on Windows and Linux plus PostgreSQL 17. An explicit TEST_DATABASE_URL must be an empty disposable database.

MIT. Not affiliated with Salesforce or Anthropic. Hosting and coding-agent usage have separate costs. Enterprise DNA installs, adapts and operates your version through Omni by Enterprise DNA for one setup fee, then a retainer. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_medium=readme&utm_campaign=salesforce-loyalty-management).
