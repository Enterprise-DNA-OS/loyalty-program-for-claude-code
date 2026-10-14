---
description: Import for the loyalty programme.
---

Read CLAUDE.md. Run `npm run loyalty -- import salesforce-loyalty-management --file=imports/LoyaltyProgramMember.csv --program="Harbour Rewards" --source-program="Salesforce programme ID" --history-dir=imports --actor="Operator" --dry-run`. Replace example references, dates and actor names with the operator's facts. Never guess missing values. Use --json for structured answers.

Read the relevant member and history first. Ambiguous names list candidates and stop. Present the records, date and next action in plain words. A missing result is not permission to invent it.

Preview first. Check member count and source programme. Run again without --dry-run only for the agreed import. Source point history is preserved for reconciliation, not issued as new points. Never promise full migration from a member export. Read docs/replace-salesforce-loyalty-management.md.
