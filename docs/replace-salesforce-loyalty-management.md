# Replace the loyalty back office

## Export from Salesforce

Use Salesforce Data Loader Export with an authorised account. Choose Show all objects if needed, select LoyaltyProgramMember and save CSV. Include Id, ProgramId, MembershipNumber, MemberStatus, EnrollmentDate, LastActivityDate and CanReceivePromotions. Include Contact.Name, Account.Name or GroupName where accessible. The membership number is the fallback display name. Custom columns are preserved.

[Salesforce Data Loader export instructions](https://help.salesforce.com/s/articleView?id=exporting_data.htm&language=en_US&type=5).
[Salesforce Loyalty Management Developer Guide](https://resources.docs.salesforce.com/latest/latest/en-us/sfdc/pdf/loyalty_api.pdf), standard objects LoyaltyProgramMember, LoyaltyMemberCurrency, LoyaltyLedger and TransactionJournal. Checked 14 October 2026.

Export only the programme being migrated, exclude deleted records, and retain a secure original copy. Export point-history objects separately if required. Use the filenames LoyaltyMemberCurrency.csv, LoyaltyLedger.csv and TransactionJournal.csv in the history directory. Include Id and the object's member reference: LoyaltyMemberId for LoyaltyMemberCurrency, LoyaltyProgramMemberId for LoyaltyLedger, MemberId for TransactionJournal. Extra fields remain intact. The importer supports these exact files; other history objects need mapping.

## Prepare and preview

Use a fresh DATA_DIR, run npm run migrate, and add the programme with add-program and its approved terms reference. Do not mix demo members with real records.

```bash
npm run loyalty -- add-program --name="Our Rewards" --terms="Approved terms reference" --actor="Your name"
npm run loyalty -- import salesforce-loyalty-management --file=imports/LoyaltyProgramMember.csv --program="Our Rewards" --source-program="Your Salesforce programme ID" --history-dir=imports --actor="Your name" --dry-run
```

Remove --dry-run to write. Omit --history-dir for a member-only import. Required headers are case-insensitive. CSV supports BOM, CRLF, quoted commas, newlines and doubled quotes. Duplicate headings, malformed rows, unexpected programme IDs, unknown member references and changed source snapshots fail the entire import. Identical source IDs and contents are skipped safely. Original member columns are held in source_data; point history is held in source_records. source-history shows those records for a member.

## Mapping

| Salesforce | Local record |
|---|---|
| Id | Unique source_id |
| ProgramId | Checked against --source-program, mapped to selected local programme |
| MembershipNumber | Programme-specific member number |
| Contact.Name, Account.Name, GroupName | Name, then membership number as fallback |
| MemberStatus | active, inactive or merged |
| EnrollmentDate, LastActivityDate | Calendar dates |
| CanReceivePromotions | Permission flag, evidence still requires review |
| Extra member fields | Original source_data |
| Optional point-history exports | Source evidence, not spendable points |

## Reconcile before cutover

A member import is not a financial or points migration. Balance summaries do not identify remaining dated lots. Old accruals can already have been spent, reversed or expired. This importer never credits a source summary as a new earning. Verify remaining points, expiry dates, currencies, tier rules and outstanding rewards against Salesforce. Build and test an explicit migration from reconciled lots before using live redemption. Enterprise DNA does this mapping as part of the custom version. There is no automatic full-history replay or promise of same-day production cutover.

This base supports one whole-number point unit per programme. Escrow, negative or fractional points, vouchers, promotions, existing approvals, tier entitlements, contacts, attachments and partner settlements are not reconstructed. Source copies remain available for review. The export command preserves all local records and original source evidence in JSON, but does not restore a database automatically. Take database backups as well.

Run balances, source-history and compliance, compare counts and source values, then test representative earnings and rewards in isolated data. Keep the existing service until the owner accepts the reconciliation and the required connections work. Do not cancel a subscription on the strength of a member count alone.
