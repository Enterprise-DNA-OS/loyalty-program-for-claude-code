# Member record controls

Sources checked 14 October 2026. These are New Zealand record checks, not a legal opinion, compliance certification or an Australian rules implementation. The operator determines jurisdiction, lawful purposes and the programme's terms.

| Check | Implemented rule | Basis |
|---|---|---|
| retention_review | Flag missing retention basis, missing review date or a date before today. Never auto-delete. | NZ Privacy Act information privacy principle 9 limits retention to what is required for lawful purposes. It does not prescribe our review interval. |
| promotion_evidence | Flag promotions enabled with no consent reference. Imported permissions require evidence review. | NZ commercial electronic messaging rules require consent and also sender identity and an unsubscribe facility. This build sends nothing and does not assess a proposed message. |
| program_terms | Flag members whose programme has no terms reference. New point issuance refuses missing terms. | Internal evidence policy. No assertion that any particular point-expiry term is lawful. |

[Privacy Commissioner: principle 9](https://www.privacy.org.nz/privacy-principles/9/).
[Department of Internal Affairs: three steps](https://www.dia.govt.nz/Spam-Three-Steps).

The demo review dates, 90-day dormancy threshold, 30-day expiry window, whole-number points and rolling 365-day tier rules are internal examples. They are not legal time limits. A flag is a request to inspect evidence, not a finding of a legal breach. The absence of flags does not establish compliance. Retention basis and consent references remain operator assertions.

The reward state machine requires a separate actor label for approval. Labels are not authentication. Production access controls and a real approval process must support them. No financial liability valuation, payments, stored-value gift cards or cash settlement is implemented.
