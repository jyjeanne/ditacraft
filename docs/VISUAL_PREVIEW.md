# Visual Preview

The visual preview shows a DITA topic as a page — headings, paragraphs, notes, tables, figures,
steps — next to its source, and updates it **as you type**. It needs no DITA-OT and no Java, and
it does not wait for a save.

It is what **DITA: Preview** (`Ctrl+Shift+H`) opens by default. The DITA-OT HTML5 preview is
still available as **DITA: Preview with DITA-OT**, and maps always preview with DITA-OT.

## Opening it

- Open a `.dita` topic and run **DITA: Preview**, press `Ctrl+Shift+H`, or click the preview icon in
  the editor title bar.
- The preview opens beside the editor and **follows the active DITA editor**. Click **Lock** in its
  toolbar (or run **DITA: Preview — Lock/Unlock to This Topic**) to keep it on one topic.
- To switch the default back to DITA-OT, set `"ditacraft.previewEngine": "dita-ot"`.

## What the page shows

| Source | On the page |
|---|---|
| `title`, `shortdesc`, `section`, `example`, nested topics | Headings at the right level, lead paragraph, sections |
| `note` (every `@type`), `hazardstatement` | Labelled, coloured boxes ("Note:", "Tip:", "CAUTION:"…) |
| `ul`, `ol`, `sl`, `dl`, `parml` | Lists and definition lists |
| `steps`, `substeps`, `choices`, `prereq`, `context`, `result`, `postreq` | Numbered steps and labelled task sections ("Before you begin"…) |
| CALS `table`, `simpletable`, `choicetable`, `properties` | Tables with spans, column widths, `@frame`, `@colsep`/`@rowsep`, `@align`/`@valign`, numbered captions |
| `fig`, `image` | Figures with numbered captions; images sized by `@width`/`@height`/`@scale`, aligned by `@align` |
| `codeblock`, `pre`, `lines`, `msgblock`, `screen` | Preformatted blocks (whitespace kept; `outputclass="language-…"` shown as a label) |
| `fn`, `xref type="fn"` | Footnote markers numbered in reading order and a footnote list at the end; a footnote with an `@id` is numbered where an `xref` references it |
| `related-links` | "Related information" list |
| MathML, SVG | Rendered natively |
| Specialized elements | Rendered like the element they specialize (from `@class`) |
| Elements without any class | A dashed box labelled with the element name |

Labels follow VS Code's display language (English and French).

## References

The preview resolves references the way an output would, using DitaCraft's key space:

- **`keyref`** on phrases, keywords, terms: the key's text (or its navtitle / target title).
  Key-derived text has a dotted underline; hover for the key name.
- **`conref` / `conkeyref`**: the reused element itself — a reused table keeps its frame and
  columns, a reused image its `href` (relative to its own file) — with the referencing element's
  attributes winning, as in DITA processing. `conrefend` ranges, reuse inside reused content and
  chained reuse are followed; reuse of an element's own ancestor, and cycles, are reported instead.
  Reused content has a light tint; hover for its origin.
- **Empty `xref`/`link`**: the target topic's or element's title.
- **Glossary** `term` / `abbreviated-form` with a key to a glossentry: the term, or the surface
  form on first use and the acronym afterwards.
- **`coderef`** (with `#line-range(…)`), **`mathmlref`**, **`svgref`**: the referenced file.
- **Images** by `href` or `keyref`.

What cannot be resolved shows a `[key]` placeholder and a tooltip with the reason; the Problems
panel lists it as usual. References are re-resolved when a reused file or a map changes, and on save
(`ditacraft.previewResolveOnSave`). Topics over 2 MB are not resolved automatically.

## Map context

A topic is often used in a map — or in several maps, or several times in one map with different
keys (`@keyscope`). The visual preview (and the visual editor) shows a topic **in a place of a map**:
its map context, shown on the status line (**🗺 Sync Client User Guide › Getting started**: the root
map's title and the navigation above the topic).

- **Keys** resolve in that map's key space, in the key scope of the reference: the same topic shows
  "Alpha" in the `prodA` scope and "Beta" in the `prodB` scope. Reused content's keys and keyed
  images too; the link picker offers that map's keys.
- **Metadata** the map gives the topic (DITA's cascading): its language — generated text such as
  note labels follows the topic's `xml:lang`, else the map's, else VS Code's — and its profiling
  attributes: when the active DITAVAL filter excludes the topic in that place (a reference with
  `audience="admin"` under a filter excluding `admin`), the preview says so in a banner.
- **Which place**: the first one found — maps that no other map references are root maps, searched
  through their submaps, the project's root map (`ditacraft.rootMap`) first — unless you choose
  one: click the status line item, or run **DITA: Choose Map Context**, and pick a place (with its
  root map, submaps and key scope), **Automatic**, or **No map context** (keys from the nearest root
  map, as elsewhere in DitaCraft). **Open target** on a map's row in the visual editor also shows the
  topic in that row's place. Choices are kept per topic in the workspace.
- References in relationship tables, key definitions and resource-only references are not places.

## Working with the page

- **Scroll sync** — scrolling the editor scrolls the page to the same element, and the other way
  round. Clicking the page moves the editor cursor to that element. Toggle with **Sync** in the
  toolbar or `ditacraft.previewScrollSync`.
- **Ctrl+click** (Cmd+click) a link to open its target, reused content to open its source, or any
  other element to jump to it in the editor. **Open source** / **DITA: Preview — Go to Source** opens
  the topic at the element selected on the page.
- **Problems** — elements with diagnostics get a wavy underline (errors red, warnings amber); hover
  for the messages. The status line shows the count; click it to step through them.
- **Breadcrumb** — the status line shows the selected element's ancestry; click an ancestor to
  select it.
- **While the XML is broken** (half-typed tag), the page keeps the last good rendering and a banner
  shows the parse error — click it to go to the line.
- **Find** — `Ctrl+F` searches the page.

## Conditions (DITAVAL)

**DITA: Set Preview DITAVAL Filter** applies to both previews. In the visual preview, excluded
content disappears — table rows and cells included (set `ditacraft.previewShowExcluded` to dim it
instead) — and flagged content gets the filter's colors, styles and start/end flag text. The status
line names the active filter.

The filter reads a `.ditaval` file as DITA does: each value of a filtering attribute is governed by
its own rule, else its attribute's default rule (`<prop att="platform" action="…"/>`), else the
filter-wide default (`<prop action="…"/>`); an attribute excludes an element when all its values
are excluded, and an element is excluded when any attribute excludes it. The filter-wide default
applies to `@audience`, `@platform`, `@product`, `@otherprops`, `@props` and the `@props`
specializations the document declares (`@deliveryTarget`…), not to `@rev` (flagged by `<revprop>`).

The text editor shows the same decisions on the source (condition highlighting,
`ditacraft.conditionHighlightingEnabled`): excluded elements are dimmed and struck through; flagged
ones get a background tinted with the flag's colour, its style, its start and end flags (their
alternative text), a mark in the overview ruler and a hover naming the filter and the values.

![A task filtered for Windows: in the text editor the macOS and Linux steps are dimmed and struck through, and the steps flagged Admin, Check (the filter-wide flag) and New in 2.0 are tinted in their flags' colours; the visual preview beside it shows the same flags without the excluded steps, its status line naming the filter](images/condition-highlighting.png)

## Show markup

**Show markup** (toolbar, **DITA: Preview — Show/Hide Markup**, or `ditacraft.previewShowMarkup`)
reveals what a published page does not show: prolog metadata, comments, processing instructions,
index terms, `data`, and draft comments.

## Styling the page

The page uses the **DITA-OT HTML5 class names** (`.note`, `.note_tip`, `.codeblock`, `.topictitle1`,
`.entry`…), so a stylesheet written for DITA-OT output styles it too. Every element also carries:

- `data-dita` — the element name, e.g. `data-dita="hazardstatement"`
- `data-class` — its DITA class, e.g. `data-class="- topic/note hazard-d/hazardstatement "`

so a rule can target a specialization family: `[data-class~="topic/note"] { … }`.

Point `ditacraft.previewCustomCss` at your stylesheet (`${workspaceFolder}` is supported); it is
loaded after the built-in one. `ditacraft.previewPageWidth` sets the page width (`0` = fluid) and
`ditacraft.previewTheme` the colors (`auto` follows VS Code).

## Grammars and specializations

The preview knows each element's class and placement from a grammar compiled from DTDs:

- The OASIS DITA 1.2, 1.3 and 2.0 shells bundled with DitaCraft are compiled when the extension is
  built (`out/grammars/`). The DOCTYPE's PUBLIC identifier picks the shell; an unversioned
  identifier follows `ditacraft.ditaVersion`.
- Your own document types are read through `ditacraft.xmlCatalogPath` (the same catalog the
  validator uses), compiled on first use and cached; editing any of their `.mod`/`.ent` files or the
  catalog recompiles them.
- A document without a DOCTYPE uses the shell its root element names; one whose grammar is unknown
  uses the DITA 1.3 composite grammar, and the status line says **FALLBACK GRAMMAR**.

The status line always shows which grammar the page used.

## Restricted Mode

In an untrusted workspace the preview still renders, but your custom CSS is not applied and the
project catalog is not used; images and reused files are read only from the topic's own workspace
folder (a symbolic link pointing outside it is refused).

In any workspace, MathML and SVG are reduced to an allowlist of presentation elements and safe
attributes (no scripts, event handlers, styles, external references or embedded HTML), entity
expansion is bounded, and the page's Content Security Policy blocks scripts and network loads.

## Limitations

- Maps preview with DITA-OT; they open as rows in the [visual editor](VISUAL_EDITOR.md#maps).
- The page is read-only; the [visual editor](VISUAL_EDITOR.md) edits on a page like it.
- RELAX NG-only document types render with the fallback grammar (instances that carry `@class` still
  render correctly).
- Remote (`http:`) images are not loaded (the page loads nothing from the network).
- The preview is an authoring view, not a pixel copy of a DITA-OT build; use
  **DITA: Preview with DITA-OT** to check publishing output.

## For contributors

| Part | Location |
|---|---|
| Format-preserving XML tree (CST), offsets | `src/shared/cst/` |
| Grammar compiler (typesxml → grammar JSON), ProseMirror schema spec | `src/shared/grammar/`, `scripts/compile-grammars.js` |
| HTML renderer, labels, entities, MathML/SVG | `src/shared/render/` |
| Panel, grammar selection, reference resolution, DITAVAL, problems | `src/preview/` |
| Page script and stylesheet | `webview/preview/` |

- `npm run compile` compiles the grammars (skipped when `dtds/` is unchanged), type-checks the
  client, server and page, and bundles everything; `npm run grammars` forces a grammar rebuild.
- `npm run test:shared` runs the environment-neutral suites (CST round-trip gate, grammar compiler,
  renderer, resolver) with plain Mocha; set `DITACRAFT_CORPUS` to a folder to add an external corpus
  to the round-trip gate. `src/test/suite/visualPreview.test.ts` is the VS Code integration suite.
