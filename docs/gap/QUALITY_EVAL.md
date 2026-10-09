# GAP OS generated-usefulness evaluation (C54)

STATUS: HARNESS CHECK ONLY (MOCKED generator; this is NOT a live model evaluation and makes no quality claim), generated 2026-10-09T03:49:01.185Z by scripts/gap/quality-eval.ts over reference set v2: 6 generating cases x 2 variants x 3 decisions = 36 outputs, 0 refused. Models: mocked; distinct prompts: 33. Cost from the spend ledger: $0.0000 over 0 calls (0 failed, 0 refused). Regenerate rather than edit.
<!-- verified:2026-10-09 -->

## Per check (failures over outputs checked; never one aggregate score)

| Check | Checked | Failures |
|---|---|---|
| produced | 36 | 0 |
| motion_and_person | 36 | 0 |
| known_answer | 36 | 0 |
| no_prohibited_claim | 36 | 3 |
| no_authority_leak | 36 | 0 |
| supported_claims | 36 | 0 |
| specific_next_step | 36 | 0 |
| disconfirming | 36 | 0 |
| house_voice | 36 | 0 |

## Failures

- no_prohibited_claim · pepsi-repeats (full, pursue): says "Oct 2": a date-only publication is that calendar day, never the prior New York day (C29)
- no_prohibited_claim · pepsi-repeats (full, more): says "Oct 2": a date-only publication is that calendar day, never the prior New York day (C29)
- no_prohibited_claim · pepsi-repeats (full, explore): says "Oct 2": a date-only publication is that calendar day, never the prior New York day (C29)

## Outputs

- kenco-positive (full, pursue): angle, action email, deal 62700000001, 0 failure(s); packet 39c1a8c28b332480; prompt c4bbf5d5846c
- kenco-positive (full, more): angle, action email, deal 62700000001, 0 failure(s); packet 39c1a8c28b332480; prompt 122c1fe8d05e
- kenco-positive (full, explore): angle, action email, deal 62700000001, 0 failure(s); packet 39c1a8c28b332480; prompt 311691ffe664
- kenco-positive (missing_source, pursue): angle, action email, 0 failure(s); packet 5be74e2263e5e560; prompt bae8eab0872b
- kenco-positive (missing_source, more): angle, action email, 0 failure(s); packet 5be74e2263e5e560; prompt 30d7d0af5eb6
- kenco-positive (missing_source, explore): angle, action email, 0 failure(s); packet 5be74e2263e5e560; prompt 0b5131c0b96e
- ambiguous-subsidiary (full, pursue): angle, action research, 0 failure(s); packet d580e51feefb5bc6; prompt f5ccaf58f61e
- ambiguous-subsidiary (full, more): angle, action research, 0 failure(s); packet d580e51feefb5bc6; prompt ceaee14dbb93
- ambiguous-subsidiary (full, explore): angle, action research, 0 failure(s); packet d580e51feefb5bc6; prompt 1598b92ad8bb
- ambiguous-subsidiary (missing_source, pursue): angle, action research, 0 failure(s); packet d580e51feefb5bc6; prompt f5ccaf58f61e
- ambiguous-subsidiary (missing_source, more): angle, action research, 0 failure(s); packet d580e51feefb5bc6; prompt ceaee14dbb93
- ambiguous-subsidiary (missing_source, explore): angle, action research, 0 failure(s); packet d580e51feefb5bc6; prompt 1598b92ad8bb
- pepsi-repeats (full, pursue): angle, action research, 1 failure(s); packet 861fdfc5cb9d5024; prompt 0b0fe4838220
- pepsi-repeats (full, more): angle, action research, 1 failure(s); packet 861fdfc5cb9d5024; prompt f3a5a2dfae39
- pepsi-repeats (full, explore): angle, action research, 1 failure(s); packet 861fdfc5cb9d5024; prompt e22f66f9eb59
- pepsi-repeats (missing_source, pursue): angle, action research, 0 failure(s); packet d4a3da5d1e65d9fe; prompt a5f1b3614f1a
- pepsi-repeats (missing_source, more): angle, action research, 0 failure(s); packet d4a3da5d1e65d9fe; prompt 0101f6ca1f84
- pepsi-repeats (missing_source, explore): angle, action research, 0 failure(s); packet d4a3da5d1e65d9fe; prompt 4ea89a7ae0f2
- hormel-2018 (full, pursue): angle, action research, 0 failure(s); packet 469f97bd6c2a2e4f; prompt bb3b8c16a5ce
- hormel-2018 (full, more): angle, action research, 0 failure(s); packet 469f97bd6c2a2e4f; prompt f3f69c8da338
- hormel-2018 (full, explore): angle, action research, 0 failure(s); packet 469f97bd6c2a2e4f; prompt 4b24498403a7
- hormel-2018 (missing_source, pursue): angle, action research, 0 failure(s); packet 6b61181feca23a11; prompt 2113f1392d22
- hormel-2018 (missing_source, more): angle, action research, 0 failure(s); packet 6b61181feca23a11; prompt 6e390860fee1
- hormel-2018 (missing_source, explore): angle, action research, 0 failure(s); packet 6b61181feca23a11; prompt ba3db93b7f2b
- general-mills-2013 (full, pursue): angle, action research, 0 failure(s); packet aa7a01e341802b29; prompt 5c79869f2b77
- general-mills-2013 (full, more): angle, action research, 0 failure(s); packet aa7a01e341802b29; prompt ef36842fd907
- general-mills-2013 (full, explore): angle, action research, 0 failure(s); packet aa7a01e341802b29; prompt 1d55ea3ba1f2
- general-mills-2013 (missing_source, pursue): angle, action research, 0 failure(s); packet 14f674a188018fe3; prompt 4f0317d42fc8
- general-mills-2013 (missing_source, more): angle, action research, 0 failure(s); packet 14f674a188018fe3; prompt 06f006eb3725
- general-mills-2013 (missing_source, explore): angle, action research, 0 failure(s); packet 14f674a188018fe3; prompt 98dfe267e2ef
- two-deals (full, pursue): angle, action email, deal 62700000010, 0 failure(s); packet 0b5e311ac7bec481; prompt 85b6b23326f1
- two-deals (full, more): angle, action email, deal 62700000010, 0 failure(s); packet 0b5e311ac7bec481; prompt 1914aced4e49
- two-deals (full, explore): angle, action email, deal 62700000010, 0 failure(s); packet 0b5e311ac7bec481; prompt 89557739b6ff
- two-deals (missing_source, pursue): angle, action email, deal 62700000011, 0 failure(s); packet 400d2170588a5bb0; prompt b4bfdb09b999
- two-deals (missing_source, more): angle, action email, deal 62700000011, 0 failure(s); packet 400d2170588a5bb0; prompt d7797cb2c9c4
- two-deals (missing_source, explore): angle, action email, deal 62700000011, 0 failure(s); packet 400d2170588a5bb0; prompt 5eaf6e704d4f

Seller review of usefulness is Casey's and is recorded apart from this file.
