# DITA 1.3 Conformance Action Plan — DitaCraft Language Server

| | |
|---|---|
| Version | 1.1 — 2026-11-09 (1.0: phases 1 to 4; 1.1: phase 5, the deviations found by the conformance check of 9 November 2026) |
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
| D4 | Branch filtering (`<ditavalref>`) is not supported. Implement it, or declare it out of scope? | FLT-08 | Declare it out of scope in the conformance statement for now. **Decided (phase 4)**: out of scope; FLT-08 is marked "Out of scope" in the test book and the proposed conformance statement names it. |
| D5 | Grouped values in conditional attributes (`product="database(myDB)"`) are not supported by the DITAVAL filtering of the editor. Implement? | FLT-04 | Yes, in phase 4 (they are part of DITA 1.3 filtering). **Decided (phase 4)**: implemented. Where DITA-OT 4.3.5 departs from the standard (two cases, listed in the test book), the standard is followed. |
| D6 | The DITA-OT corpus run cannot pass. Its "DITA rules" suite counts every `DITA-SCH-*` diagnostic as a false positive, and 108 of them come from recommendation and authoring rules that are right about the DITA-OT documentation (mostly `DITA-SCH-046`, a `<section>` with a title and no id). One more failure is the duplicate keys `license` and `third-party-software`, which are in the documentation itself. Change the suite? | Corpus run (phase 6) | Check only the mandatory rules in that suite, and expect the two duplicate keys, so that the run passes and a regression shows. |
| D7 | A conref to a more general element (`<step conref>` to an `<li>`) gets no diagnostic today, and DITA-OT 4.3.5 fails it (`DOTX010E`). With the fix of CON-02 it becomes a `DITA-XREF-004` Error. Release it as a CHANGELOG "Changed" entry? | CON-02, CON-03 | Yes, as DITA-OT does: the content is not reused. **Applied as recommended (phase 5)**: a CHANGELOG "Changed" entry. |

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

Findings of phase 4:
- PEER-02 was a deviation. The root `@keyscope` of a peer map was applied: a key of a child scope of the peer map was reachable only with that scope name in it (`ext.inner.c.x`), and the name was accepted for every key. Fixed in the language server and in the extension's key space resolver.
- PEER-03: `DITA-KEY-001` now names the peer map and its key scope.
- KSC-05: `DITA-KEY-005` now checks `@keyscope`, with its own message, and no longer reports a `keys="…"` written in the text of a map.
- MAP-04: a percent-encoded `@href` (`my%20topic.dita`) did not match its file, which was reported unused. Fixed.
- KEY-11: a value with a folder (`keyref="topics/install.dita"`) is read as a key and an element, as the syntax of `@keyref` says, and is checked.
- CON-05: `@conrefend` is checked.
  - `DITA-XREF-006` (Error, as DITA-OT `DOTX071E`): an end that is missing, is not a sibling of the start, comes before it, or is in another document.
  - `DITA-XREF-004` (Warning): an end of another type, which DITA-OT accepts without a message.
  - `DITA-XREF-007` (Warning): a `@conrefend` without `@conref` or `@conkeyref`.
- FLT-04: grouped values are filtered as §2.4.3.2 says. On 22 cases, DITA-OT 4.3.5 gave the same result on 19. It ignores the default of a group (`product="database"`), and it lets an exclusion on the attribute win over a flag on the group name. The standard is followed in both cases.

Also in this phase, the partial requirements that only need stronger tests, from the test book:
- DOC-02, real DTD validation in the language server tests;
- DOC-03, a real RELAX NG validation;
- KEY-04, the same key in two sibling submaps (done in the first part);
- SUB-05, completion of controlled values and of the default.

## 6. Phase 5 — Deviations found by the conformance check of 9 November 2026

The check ran every suite on `main` at `cd524ed`, with the DITA-OT documentation corpus. It then used the knowledge graph (`docs/graph/graph.json`) to find each place where a DITA rule is implemented: the language server, the extension's key resolver, the visual preview and editor, and the MCP server. Where one rule has several implementations, each was compared with the standard and with DITA-OT 4.3.5. The check found five deviations, which the test book now marks ⚠️. They are planned here in the order of their impact.

| Order | Item | Requirement | Where | Effort |
|---|---|---|---|---|
| 1 | CON-02, CON-03 | Conref compatibility follows specialization (§2.4.2.2, §3.12.13.7) | Language server | M |
| 2 | KEY-09 | Key reference chains of any length (§2.3.4.10.6) | Language server, extension | S |
| 3 | KEY-12 | The `@keyref` of a key definition resolves in the scope of that definition | MCP server | S, after KEY-09 |
| 4 | CON-06 | Conref ranges as §3.12.13.7 says | Visual preview and editor | S |

### 6.1 CON-02, CON-03 — Conref compatibility from `@class` (M)

**Problem.** `areConrefCompatible` (`server/src/features/crossRefValidation.ts`) decides from a fixed list of element names (`CONREF_COMPAT_GROUPS`), the same way in both directions. DITA lets the referenced element be the referencing element or a specialization of it. §2.4.2.2 says "processors resolving conrefs SHOULD tolerate specializations of valid elements". §3.12.13.7 says "It is not valid to use @conrefend to reference a more general version of an element (such as using <step> to reference an <li> element)". The fixed list has three consequences:
- **False errors.** A valid conref to a specialization outside the list is an Error (`DITA-XREF-004`). This happened for all 8 standard DITA 1.3 domain elements tested: `<ph>` to `<codeph>` or `<uicontrol>`, `<keyword>` to `<apiname>` or `<option>`, `<pre>` to `<codeblock>` or `<screen>`, `<note>` to `<hazardstatement>`, and `<fig>` to `<imagemap>`. DITA-OT 4.3.5 resolves the `<ph>` and `<pre>` cases without a message and generalizes the content; the others are still to be run (step 4).
- **Missed errors.** A conref to a more general element (`<step conref>` to an `<li>`) gets no diagnostic, and DITA-OT fails it (`DOTX010E`).
- **Wrong groups.** The list groups elements that the OASIS classes do not relate:
  - `<example>` (`- topic/example`) and `<glossdef>` (`- topic/abstract …`) are with the sections;
  - `<steps-unordered>` (`- topic/ul task/steps-unordered`) is with the ordered lists.

**Steps.**
1. Generate `server/src/data/ditaClasses.ts`: the default `@class` of each element of the OASIS document types, one table per DITA version (1.2, 1.3, 2.0). Build it from the grammars that `scripts/compile-grammars.js` already compiles from `dtds/` (612 elements with a class in DITA 1.3). A test of `npm run test:shared` checks that the table matches the compiled grammars, so that it cannot drift. Three elements have one class in maps and another in topics (`shortdesc`, `linktext`, `searchtitle`): the table keeps both, and the document type chooses.
2. Find the class of an element:
   - its own `@class`, when the document writes it (a project's specialization, or generalized content);
   - otherwise, the table for the document's DITA version (the server already detects it);
   - otherwise (an unknown element without `@class`), report no compatibility problem: the server cannot tell, and must not report a false error.
3. An element is compatible when the class of the referenced element contains the most specific token of the referencing element's class (`topic/ph` is in `+ topic/ph pr-d/codeph`). Use this for `@conref`, `@conkeyref` and the end of a `@conrefend` range (CON-05), and remove `CONREF_COMPAT_GROUPS`.
4. Check with DITA-OT 4.3.5 the cases not yet run: `<keyword>` to `<apiname>`, `<note>` to `<hazardstatement>`, `<fig>` to `<imagemap>`, `<conbody conref>` to a `<body>` (more general, expected to fail), a `<shortdesc>` of a map to one of a topic, and a project specialization.

**Tests.**
- Accepted: the 8 domain cases; `<body>` to `<conbody>` (the existing test "body and conbody are compatible", renamed); an element with its own `@class`.
- Refused: `<step>` to `<li>`; `<p>` to `<note>`; `<conbody>` to `<body>`.
- Not reported: an unknown element without `@class`.
- The range end of CON-05 follows the same rule.

**Done when** CON-02 and CON-03 are ✅. The CHANGELOG gets a "Fixed" entry for the false errors, and a "Changed" entry for the conrefs to a more general element (decision D7). **Effort** M.

### 6.2 KEY-09 — Key reference chains of any length (S)

**Problem.** The extension's resolver (`followKeyrefChain` in `src/utils/keySpaceResolver.ts`) and the server (`followKeyrefChain` and `followKeyrefChainWithTrace` in `server/src/services/keySpaceService.ts`) stop after 3 hops. A key definition that reaches its target through 4 others therefore resolves to no target. DITA-OT 4.3.5 resolves it (checked on a chain k1 → k2 → k3 → k4 → k5). DITA 1.3 sets no limit (§2.3.4.10.6).

**Steps.** Follow the chain until a definition without `@keyref`, or a key already visited (the cycle check exists). Keep a safety bound well above any real chain, such as the number of keys in the key space. Make the same change in the extension's resolver.

**Tests.** Chains of 4 and of 10 hops resolve, in both resolvers. A cycle still stops. `explainKey` lists every hop.

### 6.3 KEY-12 — The MCP server resolves a `@keyref` chain in the scope of each definition (S, after 6.2)

**Problem.** `resolveKeyref` (`mcp/src/tools/ditaResolveReference.ts`) calls `KeySpaceService.resolveKey`, which follows the `@keyref` of each definition in the scope of that definition. A chain can end on a definition that still has a `@keyref` (a broken chain). The tool then looks that key up again, from the topic that makes the reference, in another scope. Example: key `a` in scope S has `keyref="b"`, and only scope T defines `b`. The language server says that `S.a` has no target, but `dita_resolve_reference` resolves it to `b.dita`. No MCP test covers chains across key scopes.

**Steps.**
1. Use the service's result as it is: a definition that still has a `@keyref` is a broken chain, reported as `resolved: false`, naming the missing key.
2. Build the resolution trace from `explainKey`, whose steps list each hop, instead of resolving again.
3. `resolveConkeyref` uses the same function, so it follows.

**Tests** in `mcp/test/tools/ditaResolveReference.test.ts`: the broken chain across scopes above; a chain across scopes that resolves; the existing cycle test.

### 6.4 CON-06 — Conref ranges in the visual preview and editor (S)

**Problem.** `resolveReuse` (`src/preview/resolver.ts`) looks for the end of a range with `findTarget(target.doc, endRef.topicId ?? target.topicId, endRef.elemId)`. The visual editor shows reused content through the same resolver. There are two problems:
- **`@conkeyref` ranges show only their first element.** §3.12.13.7 says "the map or topic element addressed by the key name component of the @conkeyref is used in place of whatever map or topic element is addressed by the @conrefend attribute". The preview uses the topic of `@conrefend` instead, so both examples of the standard (Figures 7 and 8) show only the first element. The DITA-OT documentation uses this form (`topics/migrating-to-3.5.dita`).
- **The file of `@conrefend` is ignored.** An end in another document is looked for in the document of the start, so a range can be built from the wrong document. DITA-OT reports `DOTX071E` and keeps only the start element.

**Steps.**
1. With `@conkeyref`, look for the end element in the key's topic (`target.topicId`), using the element id of `@conrefend` alone.
2. With `@conref`, resolve the file of `@conrefend` against the referencing document. When it is not the document of the start, render the start element alone, as DITA-OT does. The language server already reports such ranges (`DITA-XREF-006`), so the preview only needs to render what DITA-OT renders.
3. Add a test for `src/preview/mapContexts.ts`, which resolves the preview's keys in the map context the user chose. The knowledge graph shows that no test file imports it.

**Tests** in `src/test/shared/previewHost.test.ts`:
- Figures 7 and 8 of §3.12.13.7 render the whole range;
- an end in another document with the same ids renders the start alone;
- the existing range test still passes;
- a topic used in two key scopes resolves its keys in the scope of the chosen map context.

## 7. Phase 6 — Close-out

1. Update the test book: rows, evidence, statuses, summary and execution record.
2. Adopt the conformance statement (test book section 9) in the README, once the deviations of phase 5 are fixed, with the deviations that remain accepted (D3) and the features out of scope (D4).
3. Update `docs/VALIDATION-SPECIFICATION.md` and the user guide for the changed messages and severities, then add the CHANGELOG entries.
4. Run every suite, including the opt-in DITA-OT corpus, and record the run in the test book. Apply decision D6 first, so that the corpus run can pass: on 9 November 2026 it had 109 failures, all of them known (see D6).

## 8. Tracking

| Item | Phase | Effort | Status |
|---|---|---|---|
| D1–D5 decisions | 1 | — | Decided |
| KSC-02 key precedence between scopes | 1 | M | Done |
| ID-01 Unicode ids | 2 | S | Done |
| SUB-03 empty enumeration | 2 | S | Done |
| DOC-06 `<?xml-model?>` without DOCTYPE | 2 | S | Done |
| ADR-06 `@scope` cascade | 2 | M | Done |
| SCH-003 `<indextermref>` message and severity | 3 | S | Done |
| SCH-014 `@navtitle` message | 3 | S | Done |
| KEY-07 key without target | 3 | S | Done (accepted deviation) |
| ID-03, ID-05, KEY-04, KEY-11, KSC-05, PEER-02, PEER-03, MAP-04 tests | 4 | S each | Done (fixes for PEER-02 and MAP-04) |
| FLT-04 grouped values | 4 | M | Done |
| CON-05 `@conrefend` | 4 | M | Done |
| FLT-08 branch filtering (decision) | 4 | S | Done (out of scope, D4) |
| D6, D7 decisions | 5 | — | D7 applied as recommended; D6 open |
| CON-02, CON-03 conref compatibility from `@class` | 5 | M | Done |
| KEY-09 key reference chains of any length | 5 | S | Open |
| KEY-12 MCP: `@keyref` chains in the scope of each definition | 5 | S | Open |
| CON-06 conref ranges in the visual preview | 5 | S | Open |
| Conformance statement, documentation, release | 6 | S | Open |
