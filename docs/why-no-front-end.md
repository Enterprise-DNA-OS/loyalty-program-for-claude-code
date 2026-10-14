# Why this base uses commands

The weekly back-office job is to reconcile points, review expiring lots, approve reward requests and prepare statements. Those jobs can run from a database and clear command recipes. Read-only HTML gives managers something to review and print.

A member-facing app provides self-service balances, mobile access and live checkout interactions. This base does not provide those experiences, offline collection, automatic purchase feeds, fraud detection or a drag-and-drop programme designer. Salesforce provides a wider platform. This is a focused operational base for a business that wants its own rules and data.

Enterprise DNA scopes member screens, approved checkout connections and other needed workflows as part of a custom version. There is no front-end application in this repository. Commands change records, reports show them.
