# DITA 1.3 Conformance Action Plan — DitaCraft Language Server

| | |
|---|---|
| Version | 1.0 — 2026-11-06 |
| Source | [DITA 1.3 Conformance Test Book](DITA_1.3_CONFORMANCE_TEST_BOOK.md), sections 7 (deviations) and 8 (requirements without tests) |
| Goal | Fix the 8 deviations from DITA 1.3, give a test to the 10 untested requirements, then publish a conformance statement |

Each item names the requirement of the test book it closes. An item is done when its row in the test book is ✅ Verified, with the test that proves it.

Effort: **S** = up to half a day, **M** = up to two days, **L** = more.

## 1. Decisions needed first

| # | Question | Items | Recommendation |
|---|---|---|---|
| D1 | Key precedence between scopes changes which definition some key references resolve to. Release it as a breaking change, with a CHANGELOG "Changed" entry? | KSC-02 | Yes: it is what DITA 1.3 and DITA-OT do, and the editor currently shows a different target than the published output. |
| D2 | `<indextermref>` is valid DITA 1.3 ("reserved for future use"). Keep `DITA-SCH-003` as an Error, or make it a Warning that says DITA-OT does not process the element? | SCH-003 | Warning, with a message that does not say "deprecated". **Decided (phase 3)**: DITA-OT 4.3.5 drops the element without a message. |
| D3 | A key definition without a target or text is valid DITA 1.3. Keep `DITA-KEY-002` as a Warning (the link leads nowhere), or lower it to Information? | KEY-07 | Keep the Warning, documented in the test book as an intended best-practice check (accepted deviation). **Decided (phase 3)**: DITA-OT 4.3.5 renders such a reference as an empty element, without a message. |
| D4 | Branch filtering (`<ditavalref>`) is not supported. Implement it, or declare it out of scope? | FLT-08 | Declare it out of scope in the conformance statement for now. |
| D5 | Grouped values in conditional attributes (`product="database(myDB)"`) are not supported by the DITAVAL filtering of the editor. Implement? | FLT-04 | Yes, in phase 4 (they are part of DITA 1.3 filtering). |

## 2. Phase 1 — Key resolution between scopes (KSC-02)

**Problem.** DITA 1.3 §2.3.4.1: "When a key has a definition in the key space that is inherited from a parent scope, that definition is effective." "This allows higher-level map authors to override keys defined in referenced submaps." When a child scope defines a key that its parent scope also defines, a key reference from a topic of the child scope resolves to the child's definition. The comment in `resolveKeyEntryWithScope` (`server/src/services/keySpaceService.ts`) states this choice: "a child scope override always beats an ancestor definition".

**Steps.**
1. Pin the expected behaviour on the examples of the standard: §2.3.4.10.8 (nested key scopes) and §2.3.4.10.14 (how key scopes affect key precedence). Check it with the local DITA-OT 4.3.5 on a two-map sample: root map `version` → v1, submap with `@keyscope="product"` `version` → v2, a topic of the submap with `keyref="version"`.
2. Separate two lookups that share the qualified names today:
   - an unqualified reference from scope `a.b` looks for the key from the outermost scope inward: root `k`, then the definition made in scope `a`, then the definition made in `a.b`; the first one found is effective;
   - a scope-qualified name (`a.b.k`, written in a reference) keeps its current meaning.
3. Apply the same change to the PushDown pass, so that an inherited definition is not replaced by the child's own one in the child's namespace. The child's own definition remains available where the standard says so (step 1).
4. Mirror the change in the extension's resolver (`src/utils/keySpaceResolver.ts`, `resolveKeyInMap`), which has the same logic.
5. Update the comments that describe the old precedence.

**Tests.**
- A reference from a child scope resolves to the parent's definition when both define the key.
- A key defined only in the child scope still resolves to the child's definition.
- Three nested levels: the outermost definition wins.
- Qualified names (`product.version`) behave as decided in step 1.
- The test at `keySpaceService.test.ts` line 977 ("child-scope override wins…") is renamed or adjusted to what it really checks.
- The same cases for the extension's resolver.

**Done when** KSC-02 is ✅, with a CHANGELOG "Changed" entry (decision D1). **Effort** M. **Risk**: changes the target of some existing key references; this is the point of the fix.

## 3. Phase 2 — Validation accuracy

### 3.1 ID-01 — Unicode ids (S)

**Problem.** DITA 1.3 §2.3.1: "All values for the `@id` attribute must be XML name tokens." `DITA-ID-002` accepts only ASCII (`server/src/features/validation.ts`, `/^[a-zA-Z_][\w.-]*$/` for topic and map ids, `/^[\w.-]+$/` for other ids). A valid id such as `主题_1` is reported.

**Steps.**
1. Move `XML_NAME_START` and `XML_NAME_CHAR` from `server/src/features/profilingValidation.ts` to `server/src/utils/textUtils.ts`, and use them in both files.
2. Topic and map ids (XML ID): a NameStartChar then NameChars. Other ids (NMTOKEN): NameChars only.
3. Fix `server/test/edgeCases.test.ts` line 95, which tolerates the false report: assert that there is no `DITA-ID-002`.

**Tests.** CJK, Arabic and accented ids accepted. A digit first accepted on a non-root element and refused on a topic. Spaces and `#` refused.

### 3.2 SUB-03 — Empty `<enumerationdef>` (S)

**Problem.** DITA 1.3 §3.6.1.8: "When the `<enumerationdef>` element is empty, no value is valid for the attribute." An `<enumerationdef>` with an `<attributedef>` and no subject leaves the attribute uncontrolled, so every value is accepted.

**Steps.** In `processEnumerationDefs` (`server/src/services/subjectSchemeService.ts`), record an empty value set for the bound attribute and element. `isControlledAttribute` then returns true and every value gets `DITA-PROF-001`. Check that completion offers no value and that the DITAVAL condition editor handles an empty list.

**Tests.** An empty enumeration makes every value invalid. A merge of two schemes, one empty and one with values, gives the union of the values. Completion offers nothing.

### 3.3 DOC-06 — `<?xml-model?>` without DOCTYPE (S)

**Problem.** `DITA-STRUCT-001` ("Missing DOCTYPE declaration", `server/src/features/validation.ts` line 374) is reported on a document associated with its RELAX NG grammar through `<?xml-model?>`, as allowed by DITA 1.3 §2.6.2. It is found on `reference/books.dita` of the DITA-OT 4.3.5 documentation.

**Steps.** Do not report `DITA-STRUCT-001` when the prolog has an `<?xml-model?>` processing instruction. Optionally, when `schemaFormat` is `dtd`, say that the document is associated with a RELAX NG grammar.

**Tests.** A topic with `<?xml-model href="…topic.rng"?>` and no DOCTYPE gets no `DITA-STRUCT-001`. A topic with neither still gets it. The opt-in DITA-OT corpus run no longer reports `books.dita`.

### 3.4 ADR-06 — `@scope` does not cascade (M)

**Problem.** DITA 1.3 §3.12.13.11: "If no value is specified, but the attribute is specified on an ancestor within a map or within the related-links section, the value will cascade from the closest ancestor." The language server reads `@scope` only on the element that carries the reference (`getScopeValue` in `server/src/features/crossRefValidation.ts`). A `<topicref>` inside `<topicgroup scope="peer">` is checked as local, so a missing peer resource is an Error instead of a Warning.

**Steps.**
1. Compute the effective `@scope` from the closest ancestor that sets it: in a map, the topicref ancestors; in a topic, inside `<related-links>`. A tag scan with an element stack, like `scanKeyDefinitions` in `textUtils.ts`, gives the ancestors.
2. Use the effective value everywhere `getScopeValue` is used: the missing-file severity, `DITA-SCOPE-001` to `003`, and the skipping of external references.
3. Check whether `@format` cascades the same way in the standard (§3.12.13.10 does not say so); if not, leave it.

**Tests.** A topicref in a `scope="peer"` group with a missing target gives a Warning. An inner `scope="local"` overrides the ancestor's. A `<link>` in `<linkpool scope="external">` is not looked up.

## 4. Phase 3 — Rule messages and severities

### 4.1 SCH-003 — `<indextermref>` (S, decision D2)

**Problem.** The message says "The `<indextermref>` element is deprecated", with severity Error. DITA 1.3 §3.4.2.2 only says the element "is not completely defined; it is reserved for future use".

**Steps.** Reword the message in `server/src/messages/en.json` and `fr.json`, for example "The `<indextermref>` element is reserved for future use: DITA-OT does not process it." Set the severity from decision D2, and update the rule category if it changes. Update `ditaRulesValidator.test.ts` and `docs/VALIDATION-SPECIFICATION.md`.

### 4.2 SCH-014 — `@navtitle` attribute (S)

**Problem.** The message says the `@navtitle` attribute is deprecated. DITA 1.3 §3.2.1.5 says the `<navtitle>` element "is preferred", and "SHOULD be used" when both are present.

**Steps.** Reword in English and French, for example "Prefer a `<navtitle>` element in `<topicmeta>` to the `@navtitle` attribute." Decided in phase 3: Information rather than Warning, because DITA-OT 4.3.5 accepts the attribute without a message and DITA 1.3 only calls the element preferred.

### 4.3 KEY-07 — Key definition without a target (S, decision D3)

**Steps.** Apply decision D3. If the Warning stays, mark KEY-07 in the test book as an accepted deviation (best practice) rather than a deviation. Also note in the message that the key definition is valid but the reference produces no link.

## 5. Phase 4 — Tests for the untested requirements

| Item | Requirement | Work | Effort |
|---|---|---|---|
| ID-03 | Ids in a map SHOULD be unique (§2.3.1) | Test: duplicate ids in a map give `DITA-ID-001`. | S |
| ID-05 | A reference to a duplicated id resolves to the first element in document order (§2.3.1) | Tests for go to definition and hover on a duplicated id. | S |
| KEY-11 | `${variable}` values and `.dita` paths in `@keyref` are not reported as undefined keys | Tests for both skips. | S |
| KSC-05 | Scope names follow the key name rules; periods are legal (§2.3.4.2, §2.3.4.10.14) | Tests: a scope name with a period resolves; a prohibited character in `@keyscope` is reported (extend `DITA-KEY-005` if needed). | S |
| PEER-02 | The `@keyscope` on the root of a peer map is ignored from the referencing map (§2.3.4.5) | Test, and a fix if the peer map's own scope is applied. | S |
| PEER-03 | An unresolvable reference to a peer map key gets a message (§2.3.4.5) | Test: `scope.key` whose peer map lacks the key gives `DITA-KEY-001` naming the peer map. | S |
| MAP-04 | Topics no map references (`DITA-ORPHAN-001`) | Tests for `detectUnusedTopics`: hrefs and conrefs in maps, key targets, URLs, comments. | S |
| FLT-04 | Grouped values in conditional attributes (§2.4.3.2) | Parse groups in the extension's DITAVAL filtering (`src/utils/ditavalParser.ts` and the preview): a group excludes only when all its tokens exclude; a rule on the group name wins over the generic attribute. Tests from the examples of §2.4.3.2. Decision D5. | M |
| CON-05 | `@conrefend` ranges (§3.12.13.7) | New check: the end element exists, has the same type as the start element (or is generalizable to it), shares its parent and follows it in document order. Report like the other conref targets (Error, DOTX010E). Tests for each error row of §3.12.13.7. | M |
| FLT-08 | Branch filtering (`<ditavalref>`, §2.4.4) | Decision D4: declare it out of scope in the conformance statement, and mark the row accordingly. | S |

Also in this phase, the partial requirements that only need stronger tests, from the test book:
- DOC-02, real DTD validation in the language server tests;
- DOC-03, a real RELAX NG validation;
- KEY-04, the same key in two sibling submaps;
- SUB-05, completion of controlled values and of the default.

## 6. Phase 5 — Close-out

1. Update the test book: rows, evidence, statuses, summary and execution record.
2. Adopt the conformance statement (test book section 9) in the README, with the deviations that remain accepted (D3) and the features out of scope (D4).
3. Update `docs/VALIDATION-SPECIFICATION.md` and the user guide for the changed messages and severities, then add the CHANGELOG entries.
4. Run every suite, including the opt-in DITA-OT corpus, and record the run in the test book.

## 7. Tracking

| Item | Phase | Effort | Status |
|---|---|---|---|
| D1–D5 decisions | 1 | — | D1, D2, D3 decided; D4, D5 open |
| KSC-02 key precedence between scopes | 1 | M | Done |
| ID-01 Unicode ids | 2 | S | Done |
| SUB-03 empty enumeration | 2 | S | Done |
| DOC-06 `<?xml-model?>` without DOCTYPE | 2 | S | Done |
| ADR-06 `@scope` cascade | 2 | M | Done |
| SCH-003 `<indextermref>` message and severity | 3 | S | Done |
| SCH-014 `@navtitle` message | 3 | S | Done |
| KEY-07 key without target | 3 | S | Done (accepted deviation) |
| ID-03, ID-05, KEY-11, KSC-05, PEER-02, PEER-03, MAP-04 tests | 4 | S each | Open |
| FLT-04 grouped values | 4 | M | Open |
| CON-05 `@conrefend` | 4 | M | Open |
| FLT-08 branch filtering (decision) | 4 | S | Open |
| Conformance statement, documentation, release | 5 | S | Open |
