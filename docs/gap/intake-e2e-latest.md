# GAP universal work intake acceptance (latest)

STATUS: PASS

- PASS W1 preview: 3 subscribers read (name_headline): 1 known, 1 new at a known account, 1 needs identity; nothing written
- PASS W1 commit: 3 members with what was supplied (degree kept raw), the new person staged as candidate 3; Personas 1 and Accounts 2 unchanged
- PASS W2 idempotent: the same paste again: 0 created, 3 already in the source
- PASS W3 database: rewriting supplied provenance refused (GAP_WORK_MEMBER_FROZEN); an invented qualification refused (CHECK)
- PASS W4 conference: a person added on the phone lands in the current conference source; the same Persona now has two provenance edges (MMYQB + Inland26), shown as "also from"; the note offers Buyer Truth Capture
- PASS W5 accounts: an account list uses the same source + member model: 1 resolved, 1 unknown (no Account created)
- PASS W6 dedup: deleting a Persona two sources point at succeeds; the members keep what was supplied and lose only the derived link
- PASS cleanup: deleted {"audit":8,"members":6,"sources":3,"candidates":1,"personas":0} and the account
