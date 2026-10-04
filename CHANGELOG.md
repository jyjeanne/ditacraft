# Change Log

All notable changes to the "DITA Craft" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.10.0] - 2026-10-04

The visual preview, the visual editor for topics and maps, and the Properties view (Milestone 8 of the [ROADMAP](ROADMAP.md)). The extension is now displayed as **DITA Craft**. Also in this release: DITAVAL filtering that follows DITA's rules with flags in condition highlighting, F2 rename from usages, folder and file moves that keep every reference working, and AI features that work again (their settings panel, the quick fix, current default models and the `ditacraft.ai.enabled` switch).

### Added

**Visual preview** — `DITA: Preview` now opens a live, formatted page of the topic, rendered by DITA Craft itself: no DITA-OT, no Java, no save needed. See [docs/VISUAL_PREVIEW.md](docs/VISUAL_PREVIEW.md).
- Renders the DITA 1.3 vocabulary with DITA-OT HTML5 class names (existing `previewCustomCss` keeps working); specializations render like the element they specialize, using grammars compiled from the bundled OASIS DTDs (1.2/1.3/2.0) or your own DTDs through `ditacraft.xmlCatalogPath`.
- Resolves keyref text, conref/conkeyref (ranges, nested and chained reuse), empty cross-reference titles, glossary terms, coderef, mathmlref/svgref and keyed images. Reused tables, figures and images keep their own structure and attributes (merged under the referencing element's, as DITA specifies); self-referencing and circular reuse is reported instead of followed.
- Footnotes are numbered in reading order, including those referenced through `<xref type="fn">` and those inside reused content.
- Shows DITA Craft's diagnostics on the elements they belong to; exact element-level scroll sync in both directions; click to place the cursor, Ctrl+click to follow links and reuse.
- Applies the active preview DITAVAL filter (exclusions and flags, table rows and cells included); **Show markup** reveals prolog metadata, comments, index terms and draft comments.
- Hardened against hostile content: MathML/SVG is sanitized by element and attribute allowlists, entity expansion is bounded (no "billion laughs"), the page runs under a strict CSP, and in Restricted Mode nothing outside the topic's folder is read or shown — symbolic links included.
- Keeps the last good page and shows a banner while the XML is not well formed; light/dark/auto themes; lock to one topic; French and English labels.
- New commands: `DITA: Preview with DITA-OT`, `DITA: Preview — Show/Hide Markup`, `DITA: Preview — Go to Source`, `DITA: Preview — Lock/Unlock to This Topic`.
- New settings: `ditacraft.previewEngine` (default `visual`), `previewPageWidth`, `previewShowMarkup`, `previewShowExcluded`, `previewResolveReferences`, `previewResolveOnSave`, `previewUpdateDelayMs`.

**Visual editor** — **DITA: Open in Visual Editor** edits a topic on the preview's page (an alternative editor for `.dita` files; the text editor stays the default). See [docs/VISUAL_EDITOR.md](docs/VISUAL_EDITOR.md).
- Typing, Enter (new paragraph, list item, step…), Backspace joins, Tab/Shift+Tab in lists, bold/italic/underline/code/superscript/subscript, bulleted and numbered lists, a Style list and an Insert menu limited to what the DTD allows, CALS tables; undo/redo on the page; copy/paste keeping elements and attributes.
- Lossless: each change reaches the VS Code document as one minimal text edit. Unchanged XML stays byte for byte; typing in a wrapped paragraph changes only the typed characters; entity references, CDATA, comments and attribute layout are kept. Undo, dirty state, save, Git and validation see ordinary text edits.
- Tables: insert/delete rows and columns, merge cells right or down, split merged cells, header row on/off, Tab/Shift+Tab between cells (Tab in the last cell adds a row). CALS tables are edited on their grid: colspecs (`colname`, `colnum`) and `@cols` follow column changes, `namest`/`nameend` and `morerows` spans grow, shrink and move as rows and columns change; simple tables keep `@relcolwidth` in step.
- Reused content: selecting a `conref`/`conkeyref` box offers **Open source** (the reused element in its own file; keys, `conrefend` ranges and chained reuse followed) and **Replace with copy** (the reference becomes a copy of what it reuses, resolved by DITA's conref attribute rules; relative `href`/`conref`/image references rewritten for the new place; ids the topic already uses dropped; undoable on the page).
- Problems on the page: the language server's diagnostics (DTD, DITA rules, references, custom rules) are marked in the visual editor — a wavy underline on the exact text when the problem is in a paragraph's text, a mark on the element for a start tag or an element shown as a box — with the messages on hover, the message at the cursor and a problem count in the status line (click: next problem). Marks follow typing and refresh when the document is checked again.
- Visual editor and text editor side by side follow each other: moving the cursor in one (keyboard, mouse, Go to…, Problems panel) moves the other's to the same character; scrolling one scrolls the other (`ditacraft.previewScrollSync`). **Open in Visual Editor** starts the page at the text cursor; **Open Source** reopens the text at the page's cursor.
- Right-click menu in the visual editor (also the Menu key and Shift+F10): Cut/Copy/Paste; **Insert after ▸** and **Insert inline ▸ / Wrap in ▸** with every block or phrase element the DTD allows there (common ones first, the rest grouped by domain); **Change to ▸**; **Table ▸**; reused content actions; on the element at the cursor **Select**, **Move up/down**, **Remove tags (keep content)**, **Delete**, **Attributes…**; **Show in source**. Menus are fully keyboard-driven (arrows, →/←, Enter, Escape, type-ahead); the toolbar's Insert and Table menus use the same menus. Moving a block keeps comments and layout between blocks in place; wrapping text in a phrase keeps its line breaks and entity references.
- Reused content shown in the visual editor: a `conref`/`conkeyref` box now shows, under its source, the reused content as the preview renders it (keys, `conrefend` ranges, nested reuse and images resolved), read only; it is updated when the topic or a reused file changes (unsaved edits in an open editor, saves, changes on disk, maps for keys). Unresolved reuse shows why.
- Image resizing in the visual editor: a selected image has a handle on its bottom-right corner; dragging it shows the new size (proportions kept, a centred image grows on both sides) and releasing writes it — `@width` and `@height` scaled together in their own units, `@width` in pixels for an image without either, `@scale` removed; written in place. Escape cancels, Ctrl+Z undoes.
- Column widths in the visual editor: tables show their column widths (`colspec/@colwidth`, `@relcolwidth`) as the preview does, and dragging the border between two columns moves width from one to the other (guide line with the new values, Escape cancels, Ctrl+Z undoes). Proportions are written as whole numbers out of 100 (`30*`/`70*`; rewritten that way once when they do not add up to 100), fixed widths keep their unit, a CALS table without colspecs gets them; only the changed `@colwidth` values are rewritten, in place.
- Links in the visual editor: **🔗**, **Ctrl+K** or **Link…** (right-click) open a target picker — elements of this topic (`#topic/element`), keys of the root map (`keyref`), topics and maps of the workspace with a second step for a topic's elements (`other.dita#other/setup`, relative to the topic), web addresses (also typed in the search box; `scope="external" format="html"`). Selected text becomes the link text, else an empty `<xref/>` is inserted (shown on the page with its target). On a link: **Change link target…** (only `href`/`keyref`/`scope`/`format` change), **Open link target**, **Remove link**. Links only where the DTD allows them.
- Images in the visual editor: **🖼 ▾** (toolbar) and **Image ▸** (right-click) insert an image **in the text**, **on its own line** (`placement="break"`) or **in a figure** (with an empty title for the caption), where the DTD allows it; pick the file (its `href` relative to the topic) and type its alternative text (`<alt>`). Pasted images (screenshots) are saved next to the topic (`images/<topic>-1.png`…, setting `ditacraft.imagePasteFolder`) and inserted; image files dropped from the Explorer (Shift) are linked where dropped. On an image: **Replace image…** and **Alternative text…**. Images now show on the page at their width/height, alignment and placement, as in the preview.
- Quick fixes in the visual editor: with the cursor on a problem, **Ctrl+.**, **Quick Fix…** (right-click) or a click on the message in the status line lists the fixes VS Code offers for it (the language server's, and **Fix with DITA Craft AI**), the recommended one first. A fix that only edits the topic is made on the page as one of its own changes — only what it changes is rewritten, and Ctrl+Z on the page takes it back; a fix before the root element (Add DOCTYPE), a command (AI) or one that edits other files is applied to the document, which the page then follows.
- Keys and link titles resolved in the visual editor: an empty phrase given by a key (`<keyword keyref="product"/>`) shows the key's text, an empty link (`<xref href="…"/>`, `<xref keyref="…"/>`) its target's title, and an image given by a key its file — as the preview resolves them, instead of `[key]` or the address; hover says where each comes from. They follow changes to the target, its title or the maps (unsaved edits included). A key that is not defined or a target that cannot be found stays `[key]` or the address, marked, with the reason on hover.
- Menus and styles follow the DTD inside mixed content: the grammar now records which child elements each mixed-content element allows, so a `<note>` no longer offers `<section>`, a `<title>` no longer offers `<xref>`. (Grammar compiler 1.1.0: compiled grammars are rebuilt once.)
- Fixed: deleting an element kept whole inside bold (an image, a reused phrase) could leave an empty `<b></b>`; attribute changes to a pasted element kept as written were not saved, and a pasted copy kept its `@id`; an empty link shows its target.
- Changes made in the text editor reach the page; while the XML is not well-formed the page waits with a banner. Metadata, images, footnotes, reused content and other content not editable on the page yet is shown and kept as written.

**Maps in the visual editor** — maps and bookmaps (`.ditamap`, `.bookmap`) open in the visual editor too (**DITA: Open in Visual Editor**, **Reopen Editor With…**). See [docs/VISUAL_EDITOR.md](docs/VISUAL_EDITOR.md#maps).
- The map's title, then one row per reference — `topicref` and its specializations (`chapter`, `part`, `appendix`, `keydef`, `topichead`, `topicgroup`, `mapref`, book lists…) and `navref` — nested as in the map. A row shows its label (its `<navtitle>`, else `@navtitle`, else the title of the topic or map it points to — read from the file, through the key space for `keyref`, updated when that file changes, saved or not —, else a text key's `<keyword>`, else its target as written), its kind, its keys and its target. A target that cannot be read is marked, with the reason on hover. A reference's `<topicmeta>` and a book's `<bookmeta>` show with **Show markup**. Relationship tables are shown as tables.
- Click a row to select it (the Properties view shows its attributes); double-click, Ctrl+click, Enter or **Open target** (right-click) opens its target beside the map (other formats in VS Code's editor for them). Fold rows with their arrow, **Expand all** / **Collapse all** on the toolbar (page state only). With a row selected, ↑/↓ move between the rows shown, ←/→ fold, unfold and move to the parent or first child row; typing does nothing on a row.
- **Insert** adds after the selected row any element the DTD allows there, the new row selected; **Move up**, **Move down** and **Delete** work on rows; problems and quick fixes on rows as in topics. Everything is written as minimal edits, the rest of the map byte for byte (every map and bookmap of the corpus round-trips; random structure edits on their rows are fuzzed).
- Editing the map: **Add reference…** (toolbar **＋ Reference**, right-click) and **Change target…** (Ctrl+K) use the link picker in a map mode — keys of the root map, topics and maps of the workspace chosen as a whole, web addresses; a new reference is a `topicref` or, where the DTD wants it, the selected row's own kind (`chapter` after a chapter), shown at once with its target's title. **Edit label** (F2) edits the label on the row's line and writes it as the row's `<topicmeta>/<navtitle>` (made when missing) or `@navtitle` (when the row has one), with `locktitle="yes"` for a reference to a topic; an empty label removes it. **Tab / Shift+Tab** (also ⇥/⇤ and Indent/Outdent) nest a row in the row before it or take it out; **dragging** a row by its line moves it before, after or into another row, with a line showing where — all only where the DTD allows, folds kept.
- Relationship tables: a `<reltable>` is a table — column headers show their `@type`, cells hold references (rows), an empty cell says so. **Insert relationship table** (toolbar **▦ Relationships**, **Insert ▸ reltable**) adds a header of three columns and a row of empty cells (after the selected row where the DTD allows it, else at the end of the map). A click selects a cell; with a cell selected the arrow keys and Tab move between cells (Tab past the last one adds a row), Enter adds a reference into it. **Relationship table ▸** (right-click, toolbar): rows above/below, move up/down, delete; columns left/right, delete — a row has a cell per column, a column goes with its header and its cell in every row, at least one row and one column stay. References are dragged into cells. The generic Move/Delete/Insert after leave a table's rows, cells and header out.
- Map context: the visual preview and the visual editor show a topic in a place of a map — the first place found (root maps searched through their submaps, `ditacraft.rootMap` first), or the one chosen with **DITA: Choose Map Context** (also the status line item), or the place of the row it was opened from (Open target in a map). Its keys resolve in that map's key space and in the reference's key scope (also in reused content and the link picker); generated text follows the topic's `xml:lang`, else the one the map gives it; when the active DITAVAL filter excludes the topic through the metadata its map gives it, the preview says so. The status line shows the place (the root map's title and the navigation above the topic). Relationship table references, key definitions and resource-only references are not places.
- The lossless writer re-indents an element moved to another parent as a whole (its lines shifted to the new depth; not when it holds preserved whitespace), and writes an element left without children by a move as `<tag/>`. A moved element keeps what the page resolved for it (a row's title, reused content) instead of showing its source until the next resolution.
- Also in topics: **Insert** with a block selected (an image on its own line, a box) now inserts after that block, not after its container, and a new element without text (an empty figure) is selected; the status line keeps the innermost elements of the cursor's path when it does not fit; **Open link target** opens a non-DITA file (a PDF, an image) in VS Code's editor for it instead of as text.

**Properties view** — a **Properties** view in the DITA Craft side bar (**DITA: Show Properties**) lists the attributes of the element at the cursor, in the visual editor or the text editor (topics and maps). See [docs/VISUAL_EDITOR.md](docs/VISUAL_EDITOR.md#properties-attributes).
- Every attribute the document type allows, grouped (identity and reuse, profiling — including your `props` specializations —, common, element-specific, architecture), with enumerations as drop-down lists, defaults and required marks; the breadcrumb selects an ancestor.
- Profiling attributes offer the subject scheme's values; ids are checked for format and uniqueness in their DITA scope.
- A change edits only that attribute in the start tag (other attributes and a multi-line layout are kept); in the visual editor it is undoable on the page.

**Grammar compiler** — the bundled DTD shells are compiled to grammar JSON at build time (`out/grammars/`, `npm run grammars`), giving every element's class, placement, content model and attributes; project grammars are compiled on first use and cached until any included module or the catalog changes.

### Changed

- The extension's displayed name is now **DITA Craft** (was DitaCraft): in the Marketplace, the activity bar, the Settings section, the AI command titles, the notifications and other messages ("DITA Craft: …", "DITA Craft AI: …"), the output channel, the language server's name ("DITA Craft Language Server"), the README, the ROADMAP and the user guide. The visual preview's tab and the chat participant show the DITA Craft logo (the extension's icon) instead of the old robin icon, which is removed. The extension ID `JeremyJeanne.ditacraft` — so the Marketplace listing, its installs and reviews —, the `ditacraft.*` settings and commands are unchanged.
- `DITA: Preview` (formerly "Preview HTML5") uses the visual preview for topics. Maps, and every preview when `ditacraft.previewEngine` is `dita-ot`, still use DITA-OT; `ditacraft.previewAutoRefresh` keeps controlling the DITA-OT preview's refresh on save.
- README reorganized for the Marketplace: the visual editor first, with screenshots (`docs/images/`); the developer setup moved to `docs/DEVELOPMENT.md` and the release notes before 0.9.0 to `docs/RELEASE_HISTORY.md`. ROADMAP: Milestone 8 (visual preview and visual editor).
- `scripts/screenshots/`: takes the README's and the user guide's screenshots in a real VS Code window, on a demo project (`node scripts/screenshots/shoot.js`); the `map` shot shows the demo map in the visual editor, the `reltable` shot its relationship table, the `flags` shot condition highlighting and the visual preview with a DITAVAL filter (demo `filters/windows.ditaval`; shown in the README's visual preview section, `docs/VISUAL_PREVIEW.md` and the user guide's Visual Preview and Condition Highlighting topics).
- **Rename Symbol (F2)** works from a reference, not only at the definition: on the key of a `keyref`/`conkeyref` it renames the key in the map that defines it for that file (key scopes included), on the topic or element part of an `href`/`conref` fragment or on the element after a key (`key/element`) it renames that id in the file it is in — every usage updated as from the definition. When the definition cannot be found (a key that is not defined, an element that does not exist), the reason is shown at the cursor. Renaming an element id now also updates `keyref="key/element"` references (verified through the key space, as `conkeyref`), and renaming a topic id the topic part of `#topic/element` references (before, only `#topic`).
- Condition highlighting (`ditacraft.conditionHighlightingEnabled`) shows the active DITAVAL filter's flags in the text editor, not only its exclusions: a flagged element gets its flag's look — a background tinted with the flag's colour (its `backcolor`, else its `color`), its `style` (bold, italics, underline, double underline, overline, line-through), its start and end flags as their alternative text (⚑ for an image without one), a mark in the overview ruler — and a hover naming the filter and the values. It is decided by the visual preview's own filter, so the text editor and the preview agree (a filter-wide flag included); excluded content shows no flags.
- DITA user guide: new Visual Editor chapter (working in the editor, writing on the page, tables, images and links, reused content, problems and quick fixes, Properties view) and Live Preview chapter (visual preview), with screenshots; commands, shortcuts, preview settings, glossary and introduction updated; HTML5 and PDF output rebuilt. A new cover image shows the DITA Craft name and logo (the old one still said DitaCraft and showed the old robin) — the logo as `resources/ditacraft-logo.svg`, traced from the 256 × 256 PNG (vector edges, the PNG's own colours) so it stays sharp at cover size; it is the PDF's first page, edge to edge, with the version and date from the bookmap (the plain generated title page, and the cover on page 3 with its version 0.6.2, are gone; the HTML5 output keeps its cover page, now current). The PDF's own styling is now applied: it had never been, as the customization folder lacked the `catalog.xml` DITA-OT reads it through — A4 pages, sans-serif text, coloured headings, tables and code. Its fonts are DITA-OT's logical ones (the CSS-style lists gave about 1,500 warnings), and its footer page number, a second one, is removed.

### Fixed

- The **Fix with DITA Craft AI** quick fix was never offered: it only looked at diagnostics whose source contained "DitaCraft", and no diagnostic has such a source (the language server's are `dita-lsp`, `dita-dtd`, `dita-rng`, `dita-rules`, `custom-rules`, `ditacraft`). It is now offered on the language server's errors and warnings with an AI-fixable code (content model, missing title or id, missing file, broken conref, DTD/RelaxNG, well-formedness), next to the server's own fixes — and not when `ditacraft.ai.enabled` is off.
- `ditacraft.ai.enabled` ("turn off all DITA Craft AI features") was ignored by every AI feature. Turned off, DITA Craft now probes no AI provider at startup — so no "No LLM provider available" warning —, makes no AI completions, offers no AI quick fix, hides the **Restructure Active DITA Map** button and menu items, and the `@ditacraft` chat participant, the restructure command and a quick fix chosen before the setting changed answer that AI is turned off, with a button to the setting. Turning it back on starts the AI provider without a restart. **Configure AI Settings** stays available and says AI is turned off.
- **DITA Craft: Configure AI Settings** could not be used. None of its buttons did anything: their inline handlers were blocked by the panel's own Content Security Policy. Anthropic and OpenAI had no row until a key existed, so there was nowhere to enter one, while Ollama, which needs no key, had a key field. A saved key, a new AI mode or a new Ollama server was only used after restarting VS Code. The panel now lists every provider with its status and the reason (available; unavailable — no Copilot chat model, Ollama not reachable, a key that is not usable; not configured; not used in the AI mode; turned off). It has the **AI mode** selector the user guide describes, key fields for Anthropic and OpenAI only (**Save**, **Delete**), **Server Settings** for Ollama, and a **Test** button per provider. Test used to check only an API key's format: it now checks the connection for real, without generating text (no tokens used). For Anthropic and OpenAI the service looks up the configured model with the key; for Ollama the server must answer and have the model installed; for GitHub Copilot VS Code must offer its chat models. The provider's row says what was found: a refused key (401), a key without access (403), a model that does not exist for the key (404), a rate limit, a server that cannot be reached or does not answer within 15 s, or a model not pulled (`ollama pull …`). A provider that passes becomes the active one; an active provider that fails gives way to the next available one. Saving or deleting a key, changing the mode and **Refresh** detect the providers again, and changes made in the Settings editor (mode, models, Ollama server) are used at once too. Running the command again shows the same panel instead of opening another. The README and the user guide now describe the panel as it is, and call it and **DITA Craft: Restructure Active DITA Map** by their real names. The README no longer says the panel shows metrics: they go to the output channel.
- The default Anthropic model (`ditacraft.ai.provider.anthropic.model`) was `claude-3-5-sonnet-20241022`, which Anthropic has retired, so the AI features failed with an Anthropic key unless another model was set. It is now `claude-sonnet-5-5`. A model you set yourself is kept; **Test** in **Configure AI Settings** says whether your key can use it. The README lists current models.
- The default OpenAI model (`ditacraft.ai.provider.openai.model`) is now `gpt-6.1-sol`, OpenAI's current balance of capability and cost, instead of `gpt-4o`. OpenAI's reasoning models (the o-series, GPT-5 and later) work now: they refuse `max_tokens` and any temperature but the default, so DITA Craft sends them `max_completion_tokens` with room for their reasoning tokens (25,000, as OpenAI advises; only the tokens used are billed) and low reasoning effort, and keeps the temperature for older chat models such as `gpt-4o`. A model you set yourself is kept.
- MCP server: the filters of the `dita://workspace/diagnostics` and `dita://workspace/keys` resources did not work — a URI with a query string (`?severity=error`, `?limit=10`, `?search=product`…) was answered "Resource … not found", because the MCP SDK looks a resource up by its exact URI. Each is now also offered as a URI template (`dita://workspace/diagnostics{?severity,limit,filePattern}`, `dita://workspace/keys{?includeScopes,search}`) whose parameters are all optional and can come in any order. An unknown parameter or value is now an error that says what to use, instead of a wrong result (`limit=ten` returned everything, an unknown severity nothing); `info` is accepted for `information`. The MCP server also reports the extension's version (it said 0.8.0). On Linux and macOS, a path with backslashes (`topics\nested\a.dita`, as a client on Windows may send it) is now read as on Windows, backslashes as separators; it was taken as one file name.
- `ditacraft.ai.mode`: `copilot-only` also used Anthropic, OpenAI and Ollama, and `byok-only` also used Ollama. `copilot-only` now uses GitHub Copilot only and `byok-only` your Anthropic or OpenAI key only, as their descriptions say. An unknown value counts as `auto`.
- A template's `{{date}}` and a new bookmap's `<created date>` were the UTC date, not the author's: past midnight in Europe they said yesterday, in the evening in the Americas tomorrow. They are now today's date in the computer's time zone.
- **DITA: Edit DITAVAL Conditions** could not be used from the keyboard: its chips were not focusable, Enter in the add form did nothing, and every change sent the focus back to the top of the panel. Chips are now buttons (Tab, Enter/Space) that tell screen readers their value, their action and what pressing them does; the focus stays on the chip you changed (or in the value box after adding a condition, the attribute kept), the change is announced, Enter in the add form adds the condition, and the add form's fields are labelled. The user guide's description of the panel (form rows, reordering, a preview inside it) is corrected.
- Moving a topic or map to another folder broke its own relative references (links, images, reused content): only the references *to* it were updated. Its own `href`, `conref`, `conrefend`, `data`, `codebase` and `longdescref` values are now re-resolved from the folder it was in and rewritten for the new one; files moved together keep pointing at each other, and a renamed file's references to itself follow the rename. `conrefend` references to a moved file are updated too, and references inside comments and CDATA sections (code samples) are no longer rewritten. Moving or renaming a folder, which VS Code reports as one move, used to update nothing; everything in it now moves with it — references into it (to topics, maps, images) follow, its topics' references out of it are rewritten, references between its files stay. Renaming or moving any other file a topic or map refers to — an image, a `.ditaval` in a `<ditavalref>`, a PDF — now updates the references to it as well (only DITA files were followed). A moved `.ditaval` file (or a moved folder holding it) is also followed by the publishing profiles that use it — their `ditavalPath` setting, in the workspace or user settings — and by the active preview filter, which kept pointing at the old path. So are the settings that name a file or folder — `ditacraft.rootMap` (the language server and the status bar are told, as **DITA: Set Root Map** does), `templatesPath`, `xmlCatalogPath`, `previewCustomCss`, `customRulesFile` — each written the way it was (relative, `${workspaceFolder}/…` or absolute); renaming the root map used to leave key resolution on auto-discovery with a stale setting. The updated files are now actually saved, as the notification implied: they were left unsaved when not open in an editor.
- **DITA: Inline Conref** copied only the reused element's content, dropping its attributes: `<note conref="…"/>` reusing `<note type="important">` became a plain note. The element is now written as DITA's conref resolution makes it (the rules the visual editor's **Replace with copy** follows): its own attributes, then the target's attributes it does not set — not the target's `id` or `class` —, a relative `href`/`data`/… among them rewritten for the new place, `-dita-use-conref-target` taking the target's value, every conref attribute consumed. The relative references inside the copied content are rewritten too — they were copied as written, so a note reused from `shared/` into another folder kept `<xref href="other.dita"/>` and `<image href="../images/a.png"/>`, both broken; a same-file `#topic/el` or same-topic `#./el` reference now names the target's file. A `conrefend` range or a `conaction` push, which is not one element, is no longer inlined (only its first element was).
- **DITA: Find and Replace in Files** changed markup: it matched tag names and attribute names and values as well as text, so replacing "title" turned `<title>` elements into `<heading>`, and ids, links and keys changed with the text. It now searches text content only — tag and attribute names, comments, CDATA, processing instructions and the DOCTYPE are never matched, a match never spans markup, and a match never cuts an entity reference (`&amp;`) in two. A new find option, **Also in attribute values**, searches attribute values too.
- **DITA: Find and Replace in Files** and **DITA: Batch Update Metadata** opened VS Code's Refactor Preview with every change unticked (VS Code shows edits that need confirmation that way), so **Apply** silently did nothing until each file was ticked. Both now ask first, as VS Code's Replace All does: a dialog lists the files and their changes, **Replace** / **Apply** makes every change (undoable), **Review Changes…** opens the Refactor Preview to tick the changes to make.
- Renaming a key (F2 on `keys="…"`) dropped the element part of a `keyref="key/element"` usage: `<xref keyref="setup/folders"/>` became `keyref="new-key"`, pointing at the whole topic instead of the section. It now becomes `keyref="new-key/folders"`, as `conkeyref` values already did.
- The output format pickers (**DITA: Publish**, publishing profiles) only ever offered html5, pdf, xhtml, epub, htmlhelp and markdown: the list read from DITA-OT expected `name - description` lines, but DITA-OT 4.x prints bare names, so it always fell back to that static list. Every installed transtype is now offered (`pdf2`, `markdown_github`, plugin transtypes…). **DITA: Validate Entire Guide Using DITA-OT** now runs with DITA-OT's `dita` transtype, as it was meant to when available, instead of html5.
- A publishing profile's DITAVAL path was saved in the workspace settings with the system's separators (`filters\\web.ditaval` on Windows), which broke the profile for teammates on macOS or Linux. It is now saved with `/`, and paths saved with `\` by earlier versions still resolve on every platform.
- DITAVAL filtering (visual preview and condition highlighting) now follows DITA's filtering logic: an attribute excludes an element only when every one of its values is excluded — `audience="external internal"` stays when only `internal` is excluded; before, one excluded value excluded the element. An element is still excluded when any one attribute excludes it, and a value's own rule still wins over its attribute's default. `deliveryTarget` rules now apply to condition highlighting (attribute names were compared case-sensitively against the lower-cased rule, and an element whose only condition was `deliveryTarget` was never found). A filter-wide default rule (`<prop action="exclude"/>`, no `att`) now applies to every filtering value without a rule of its own — after the value's rule and its attribute's default — on the conditional processing attributes (`audience`, `platform`, `product`, `otherprops`, `props`, `deliveryTarget`; in the preview also the `@props` specializations a document declares in `@domains` or `@specializations`), not on `@rev` or other attributes; it used to be ignored. The visual preview and condition highlighting flag the same way: a value is flagged when the rule that governs it (its own, its attribute's default, the filter-wide default) is a flag rule — a filter-wide `<prop action="flag" …/>` now flags every filtering value without a rule of its own, and an attribute's default flag no longer applies to a value that has its own rule (an `include`).
- Visual preview and visual editor: inline code (`codeph`, `kbd`, `samp`…) was unreadable on a light page in a dark VS Code theme (it took the colour VS Code gives code in webviews); it now uses the page's text colour.
- Visual editor: deleting or typing next to repeated character references (`&gt;&lt;`) now edits whole references in the document (the result was the same text, but the edit could start in the middle of a reference).
- Visual preview and visual editor: a problem on an image is marked with a dashed outline (the wavy underline used for text does not show on images).
- `dtds/base/catalog.xml` lacked the `-//OASIS//ENTITIES DITA 1.3 Topic Definitions//EN` entry. The bare system id `topicDefn.ent` then suffix-matched the DITA 1.2 copy, whose common elements lack `<div>`, so parsing the DITA 1.3 base topic and machinery task shells directly failed with `Unknown entity: div` (validation was unaffected only because of TypesXML's resolution order).

### Security

- Dependencies updated to fix known vulnerabilities (`npm audit --omit=dev` now reports none, for the extension and the language server): `@xmldom/xmldom` 0.9.12; through the language client, `brace-expansion` 5.0.12; through the MCP SDK, `fast-uri` 3.1.8, `hono` 4.13.13, `ip-address` 10.7.3 and `qs` 6.16.0; in the language server's tree, `brace-expansion` and `js-yaml` 4.3.2. All are semver-compatible updates.

### Development

- Client test coverage: the `c8` settings in `package.json` were never applied (`npm run coverage:check` checked a 90% default against every process the tests start, the bundled language server included). They are now in `.c8rc.json`, with `server/**` excluded — the server has its own suite and gate. Client coverage: 78% of lines, 83% of functions, 82% of branches.
- Two `@keyscope` tests of the client key space resolver failed on Windows: they read the resolver's scope map with a path that was not lower-cased as the resolver stores it there.
- `npm run test:mcp` could not run: compiling the MCP server ran out of memory, and with more memory failed with six "Type instantiation is excessively deep" errors. Each tool's input schema was a zod v3 object, which the MCP SDK reads through compatibility types costing about 5 million type instantiations per tool. The schemas now use `zod/v4` (`z.looseObject`, in the same zod package), which the SDK takes as it is: the compile takes 3 s and 260 MB, and the suite runs (88 tests). CI now runs it on Linux, Windows and macOS (`ci.yml`, after the esbuild step that builds `dist/mcp-server.js`, which the tests start), and the release workflow runs it before publishing (`release.yml`: a failure blocks the release, which ships that bundle). Clients see the same tool schemas (`additionalProperties: {}` instead of the equivalent `true`). Two `Diagnostic.message` uses in `mcp/src` handle LSP 3.18's `MarkupContent` type.

### Third-party

- TypesXML (EPL-1.0) is now listed in `THIRD-PARTY-NOTICES.md`; third-party licence texts are in `LICENSE-THIRD-PARTY/`.
- The visual editor's page bundles ProseMirror (MIT), listed in `THIRD-PARTY-NOTICES.md`.

## [0.9.1] - 2026-08-19

### Changed

- Version bump to exercise the [Auto Tag Release](.github/workflows/auto-tag.yml) GitHub Action, which tags and publishes a release whenever a version bump to `package.json` lands on `main`.

## [0.9.0] - 2026-08-15

The full [v0.9.0 implementation plan](docs/V0.9-IMPLEMENTATION-PLAN.md) — every prioritized item shipped, plus two of three Backlog items taken on as natural follow-ons (Import from Markdown/HTML deferred, as the one item genuinely needing a design spike first).

### Added

**Refactoring tools:**
- Rename key across all usages, with `conkeyref` matches verified against the key space before rewriting.
- Move topic with reference updates — rewrites every inbound `href`/`conref` when a `.dita`/`.ditamap`/`.bookmap` file is moved or renamed via VS Code.
- Extract topic from section — select a `<section>`, extract it into a new standalone topic, and replace it with an `xref`.
- Inline conref — resolve a `conref`/`conkeyref` reference and splice the target content in place, stripping the reference attribute and any nested descendant ids (to avoid a duplicate-id violation).

**Templates, scaffolding & publishing:**
- Custom topic templates and a project initialization wizard.
- Publishing profiles — save/reuse transtype + output-dir + DITAVAL + extra-args combinations, remembers the last-used profile.
- Image insertion and table insertion (CALS/simple) helpers.

**Productivity & DITAVAL:**
- Multi-file DITA-aware find & replace and batch metadata update, both previewed via VS Code's native refactor-preview UI before applying.
- Visual DITAVAL condition editor, live preview with conditions applied, and condition highlighting in the editor.
- Watch mode (`DITA: Start/Stop Watch Mode`) — automatically re-runs a full publish whenever a watched DITA file changes, with quiet status-bar-only feedback. Not incremental publishing — DITA-OT has no first-class incremental build mode.

**Knowledge tooling:**
- **OKF Knowledge Base (okf-rs)** — `npm run okf` publishes a conformant [Open Knowledge Format](https://github.com/jyjeanne/okf-rs) bundle (one Markdown+YAML-frontmatter file per concept, `git diff`-able) to `docs/okf-knowledge/`, complementing graphify's `docs/graph/graph.json`. Adds change-impact analysis, a PR-review report generator, and call-cycle detection graphify doesn't have. `okf-mcp` exposes it as an MCP tool for agent queries — see "OKF Knowledge Base (okf-rs)" in `CLAUDE.md`.

### Fixed

Found via a deep code-review pass using both graphify's and okf-rs's knowledge graphs:
- Client-side `KeySpaceResolver` (backing clickable keyref/conkeyref document links and the Key Space sidebar) had zero DITA 1.3 `@keyscope` (nested/scoped key) support at all, unlike the server's `KeySpaceService` — a keyref inside a scoped branch could silently resolve to a *different file* via a document-link click than via LSP-backed Go to Definition on the exact same reference. Ported the server's scope-prefix BFS, PushDown inheritance, inline scope block handling, and deferred peer-map resolution into the client resolver.
- `hover.ts`'s conref/conkeyref content preview (`getConrefPreview`) no longer carries its own independent, buggy copy of the element-span depth-tracking algorithm — missing self-closing-element check and no comment-stripping meant a self-closing target followed by a comment merely *mentioning* the tag's closing bracket could leak arbitrary unrelated document content into the preview; now delegates to `elementExtent.ts`'s already-hardened `findElementExtentById`.
- `docs/graph/studio/assets/` (graphify's own vendored, minified interactive-viewer bundle) is now excluded from `.gitignore`-aware code-scanning tools — being un-excluded once caused an okf-rs scan to extract thousands of garbage single/double-letter "concepts" from the minified JS, since it isn't source code at all.

**2183+ Total Tests** — Client (966) + Server (1,134) + MCP (83)

## [0.8.2] - 2026-07-26

### Added
- **Knowledge Graph (graphify)** — `npm run graph` generates a queryable knowledge graph of the codebase into `docs/graph/` (`graph.json`, `GRAPH_REPORT.md`, `graph.svg`, an interactive studio viewer, and `flows.json` for execution-flow impact analysis) using local tree-sitter AST extraction (no LLM/API keys). Auto-regenerates during `npm run watch` and on every push to `main` via the `knowledge-graph` GitHub Actions workflow. See "Using the Knowledge Graph" in `CLAUDE.md`.

### Fixed

**Security / path traversal:**
- Extracted a shared `isPathWithinWorkspace()` guard and applied it consistently across hover, completion, definition, cross-reference validation, circular-reference detection, document links, and the MCP context-graph handler — several of these previously resolved user-authored `href` values without checking they stayed inside the workspace.
- Documents opened outside every configured workspace folder (e.g. via File > Open) no longer have workspace-boundary checks incorrectly applied to their same-directory sibling references.

**Key space / cross-file references:**
- Diamond-shaped `@keyscope` map graphs (a submap reached twice via different scope chains) no longer lose keys defined further down the re-visited submap's tree.
- Fixed Windows case-mismatch in key-space path comparisons (`resolveKey`, `explainKey`, BFS visited-set, cache invalidation) that could silently miss scope-aware key lookups and cache invalidation on Windows.
- Rename and Find All References now verify `conkeyref` matches actually resolve to the target file via the key space before rewriting/reporting them, instead of matching on element-ID text alone across the whole workspace; unverifiable matches are now logged instead of silently skipped.
- `resolveKey` calls in cross-file reference and rename loops are now parallelized instead of awaited one at a time.

**Validation pipeline races and caching:**
- A timed-out or cancelled async validation phase (cross-reference, circular-reference, RNG) no longer caches its empty fallback as a valid result, which had been able to mask broken links for up to 5 minutes.
- Cancellation/budget-exceeded early exits now still apply severity overrides, comment suppression, and the diagnostics cap.
- Profiling validation now validates against an immutable per-document subject-scheme snapshot instead of shared, possibly cross-document, service state.
- A key-space build racing with a file invalidation no longer re-caches stale data after the invalidation ran.
- The AI Quick Fix feature now checks the document version (and closed state) before applying its edit, so a multi-second LLM call can no longer apply a fix against stale line coordinates.
- `getDocumentSettings()` no longer permanently poisons a document's settings cache after a single transient configuration-fetch failure.
- Saving a `.dita` topic file now correctly invalidates cached cross-reference diagnostics in other open documents, not just when a map file changes.

**Editing / navigation:**
- Fixed a recurring bug class where a stray or mismatched closing tag desynced a name-keyed element stack, corrupting later lookups — found and fixed across `contentModelValidation.ts`, `symbols.ts` (Outline and workspace symbols), `folding.ts`, and `completion.ts`; consolidated into a shared `resyncStackToMatch()` helper.
- `fragmentValidator.ts` (used by AI Quick Fix) now reads per-document settings instead of stale global defaults.
- Fixed the DITA-SCH-011 quick fix rewriting the wrong `<image>` element's `alt` attribute when a later image existed in the document.
- Added missing `parml`, `screen`, and `syntaxdiagram` to the `body`/`conbody`/`section` content models, which had been rejecting elements the completion provider itself suggested.
- `workspaceValidation.ts`'s root-ID extraction no longer matches a nested child's `id` instead of the topic's actual root element.
- DITA-OT progress percentages (absolute) are no longer misapplied as cumulative increments in publish/preview/validate-guide, which had overshot the progress bar.

### Changed
- Consolidated duplicated reference-matching, tag-stack resync, and progress-reporting logic into shared helpers to keep the fixes above from re-diverging.
- Removed 41 stale compiled `.js`/`.js.map` files that had been committed alongside their TypeScript sources; `.gitignore` now guards against recommitting them.

### Dependencies
- **@anthropic-ai/sdk** 0.105.0 → 0.112.4
- **openai** → 6.48.0
- **vscode-languageclient** 10.0.0 → 10.0.1
- **fast-xml-parser** → 5.10.1
- **typesxml** 2.2.0 → 2.2.1
- **c8** 11.0.0 → 12.0.0
- **@types/node**, **eslint**, **typescript-eslint**, **sinon**, **@types/sinon** and other dev-dependency group bumps
- **actions/setup-node** GitHub Action 6 → 7

## [0.8.1] - 2026-06-24

### Fixed
- **Preview auto-refresh on save** (#96) — `ditacraft.previewAutoRefresh` was read from configuration but never wired to a save event, so saving a previewed file did nothing. The preview now re-renders when the previewed source file is saved. Rapid saves are debounced (500 ms) and refreshes are serialized so only one DITA-OT publish runs at a time; the refresh preserves editor focus and updates the panel in place without pulling it to the foreground. Path matching is case-insensitive on Windows/macOS so it works whether the preview was opened from the editor or the file tree.
- **CommonJS test build** — `tsc -p ./` now emits CommonJS again (Node16 module resolution), fixing a `MODULE_TYPELESS_PACKAGE_JSON` failure when running the test runner.
- **vscode-languageclient 10 resolution** — switched TypeScript `moduleResolution` so the client's `exports`-based `vscode-languageclient/node` entrypoint resolves under the new package layout.

### Changed
- **Minimum VS Code version raised to 1.125.0** (`engines.vscode`) to match the bumped `@types/vscode`, restoring `vsce package`.

### Dependencies
- **vscode-languageclient** 9.0.1 → 10.0.0
- **@vscode/test-electron** 2.5.2 → 3.0.0
- **@types/node** 25.9.3 → 26.0.0
- Additional production and dev dependency group bumps
- **actions/checkout** GitHub Action 6 → 7

## [0.7.3] - 2026-04-29

### Added

**Key Space (7-gap improvement plan complete):**
- **Keyref Chains** — Multi-hop keyref resolution follows chains across nested key scopes; `followKeyrefChain` now receives the correct scope prefix so chains inside scoped peer maps resolve against the right namespace
- **Keyscope PushDown Inheritance** — `@keyscope` on `<map>` elements correctly propagates scope down to descendant key definitions (PushDown algorithm per DITA 1.3 spec)
- **Inline Scope Branches** — `@keyscope` on non-map topicrefs treated as anonymous scope branches; descendant keys get scope-qualified aliases
- **Three Spec Improvements** — Cascade algorithm alignment, peer map key inheritance, and fallback key definition handling per KEYSPACE_CONSTRUCTION_ALGORITHM specification
- **Provenance Tracking** — `sourceLine` (1-based) added to `KeyDefinition`; computed via monotone forward scan on the XML path (O(n)) or direct newline count on the regex path; qualified scope aliases inherit `sourceLine` from their origin definition
- **Scope Explosion Cap** — `MAX_KEY_SPACE_ENTRIES` constant (50,000) and `addScopedKeyEntry()` helper gate all 6 qualified-alias insertion sites; `scopeExplosionWarning` flag set on `KeySpace` when cap is hit
- **Key Resolution Reporting** — `explainKey()` method on `KeySpaceService` returns `KeyResolutionReport` with full lookup trace and keyref chain steps; standalone `reportKeySpace()` and `formatResolutionReport()` functions expose human-readable key-space summaries
- **Key Space Bug Fixes (4 from code review)** — `followKeyrefChain` scope prefix (Gap 1 fix), XMLParser class-level singleton instead of per-call instantiation, `topicmeta` array guard for invalid DITA with duplicate `<topicmeta>` elements, `collectXmlElements` skips `?xml` PI pseudo-nodes emitted by fast-xml-parser

**Validation Pipeline:**
- **Pipeline Budget** — Configurable validation pipeline budget (`pipelineBudgetMs`, default 30 s) with early-exit checks before each major phase, preventing runaway validation on large or complex files
- **ReDoS Protection** — Custom regex rules are now screened for nested-quantifier patterns; per-rule runtime guards enforce a 10 000-match iteration cap and 2 s timeout
- **LSP 3.17 Conformance** — Server now advertises `executeCommandProvider` with all 3 registered commands; reports `serverInfo` (name + version) in `InitializeResult`; declares `interFileDependencies: true` so clients know cross-file diagnostics may change when other files are edited
- **Server Version Reporting** — `serverInfo.version` is now read from `server/package.json` at startup instead of being hardcoded

### Fixed
- **Range Formatting Data Loss** — When XML formatting changed line count (e.g., collapsing or expanding elements), range formatting could silently drop content by applying misaligned per-line diffs. Now falls back to a safe full-document replacement when structural reflow is detected
- **DITA-OT Error Code Parsing** — Modern DITA-OT 3.x/4.x outputs severity-first log format (`[ERROR] [DOTJ013E]`), but the parser only recognized the legacy `[DOTJ013E][ERROR]` format. Added 3 severity-first regex patterns so error codes are correctly extracted instead of appearing as "UNKNOWN"
- **Budget Comparison Off-by-One** — Pipeline budget check used `>` instead of `>=`, allowing one extra phase to run after the budget was exhausted
- **Sync Timeout Wrappers Removed** — `withTimeout()` was wrapping synchronous validation phases (no-op); replaced with direct calls
- **Coverage Thresholds** — Corrected CI coverage thresholds from 68 % to 63 % to match actual measured coverage, preventing false CI failures
- **Test Assertion Accuracy** — Strengthened 12+ tautological or weak test assertions across cache invalidation, edge case, and server handler tests

### Changed
- **Validation Pipeline** — Phases 9 (DITA rules) and 12 (custom rules) now enforce per-phase timeouts; budget is checked with `>=` for accurate early-exit
- **Documentation** — All architecture, validation specification, and README docs synchronized to current state; user guide updated to v0.7.3

### Dependencies
- **TypesXML** bumped from 1.19.0 to 2.0.0
- **TypeScript** upgraded from 5.9.3 to 6.0.3; `moduleResolution: node` with `ignoreDeprecations: "6.0"`; explicit `typeRoots` added to `server/tsconfig.json` and `server/tsconfig.test.json`

### Tests
- 881 server tests (up from 810 after pipeline/security work), including:
  - 31 LSP server handler tests + 19 settings tests
  - 40 automated manual-test-plan gap tests (keyscopes, Unicode/CJK, empty files, long lines, CRLF)
  - 100+ key space service tests (keyref chains, keyscope nesting/inheritance/inline branches, provenance, scope explosion cap, explainKey reporting)
  - 8 ReDoS + 2 pipeline budget tests
  - 5 range formatting tests
  - 7 DITA-OT error code parsing tests
- **1564+ Total Tests** — Client (683) + Server (881)

## [0.7.0] - 2026-03-11

### Added
- **Glossref Element Support** — Full support for `<glossref>` across schema, autocompletion, explorer, map visualizer, content model validator, and map hierarchy parser
- **Glossentry/Troubleshooting Topic Types** — Client-side validation now recognizes `<glossentry>` and `<troubleshooting>` as valid topic root elements with proper structure checks (`<glossterm>` required as first child for glossentry)
- **Multi-Version DTD Support** — Bundled DITA 1.2, 1.3, and 2.0 DTDs with master OASIS XML Catalog chaining via `<nextCatalog>`
- **External XML Catalog** — New `ditacraft.xmlCatalogPath` setting for custom DTD specializations; hot-reloads on config change
- **Scope Validation** — Validates `scope="local|peer|external"` consistency with href format (DITA-SCOPE-001/002/003)
- **Circular Reference Detection** — DFS traversal with depth limiting detects structural map reference cycles (DITA-CYCLE-001); only follows topicref/mapref/chapter/etc. (not keydef/xref/link hrefs)
- **Workspace Validation** — `DITA: Validate Workspace` command with progress notification
- **Cross-File Duplicate ID** — Workspace-wide root ID uniqueness detection (DITA-ID-003)
- **Unused Topic Detection** — Finds .dita files not referenced by any map (DITA-ORPHAN-001)
- **Bookmap Validation** — LSP warns on missing `<booktitle>` (DITA-STRUCT-006) and `<mainbooktitle>` (DITA-STRUCT-007) elements in bookmaps
- **Topicref Validation** — LSP flags `<topicref>` without target attributes (`href`, `keyref`, `keys`, `conref`, `conkeyref`) as information-level hints; self-closing containers are skipped (DITA-STRUCT-008)
- **Localization (i18n)** — All 70+ diagnostic messages translatable; English + French bundles; auto-detects LSP locale
- **DITA 2.0 Rules** — 10 new version-specific rules (SCH-050 to SCH-059): removed elements (`<boolean>`, `<indextermref>`, `<object>`, learning specializations), removed attributes (`@print`, `@copy-to`, `@navtitle`, `@query`), `<audio>`/`<video>` fallback accessibility
- **35 Total DITA Rules** — Expanded from 18 to 35 Schematron-equivalent rules across 5 categories (mandatory, recommendation, authoring, accessibility, DITA 2.0 removal); version-gated per DITA version
- **Root Map Management** — Set/clear explicit root map via command palette or clickable status bar item; workspace-level `rootMap` setting; auto-discover mode by default
- **DITA Specialization** — `@class` attribute matching for specialization-aware element handling; pre-built matchers for 20+ element types
- **Catalog Validation Service** — DTD validation with OASIS XML Catalog resolution and parser pool (3 concurrent instances)
- **RNG Validation Service** — Optional RelaxNG schema validation via salve-annos + saxes; grammar compilation with caching (max 20 schemas)
- **Subject Scheme Enhancements** — Hierarchy path display in completions, grouping by parent subject, default value preselection
- **Conref Content Preview** — Hover on `conref`/`conkeyref` shows inline preview of referenced content
- **Smart Debouncing** — Tiered validation delays (300ms topics, 1000ms maps) with per-document cancellation
- **Key Scope Support** — `@keyscope` attribute handling with scope-qualified key resolution
- **New Settings** — `ditacraft.ditaVersion`, `ditacraft.schemaFormat`, `ditacraft.rngSchemaPath`, `ditacraft.cspellAutoPrompt`, `ditacraft.xmlCatalogPath`
- **New Commands** — `DITA: Set Root Map`, `DITA: Clear Root Map`, `DITA: Validate Workspace`, `DITA: Open File`
- **New Extension Logo** — Updated branding
- **User Guide Update** — 17 files updated + 8 new DITA topics (localization, root map, 6 glossary entries)

### Changed
- **Circular Reference Detection** — Only follows structural map elements (topicref, mapref, chapter, part, appendix, glossref, etc.); excludes keydef hrefs, xref/link targets, and generic `.xml` files to eliminate false positives
- **Validation Deduplication** — Disabled client-side on-save auto-validation; LSP server now sole provider of real-time diagnostics, eliminating duplicate `dita` vs `dita-lsp` diagnostic entries
- **Diagnostics View** — Added deduplication logic to filter identical diagnostics from multiple sources
- **cSpell Auto-Prompt** — Disabled by default (new `cspellAutoPrompt` setting); manual command always available
- **Stale Diagnostics Cleanup** — Client-side `dita` diagnostics from manual validation are cleared on save to avoid conflicts with LSP diagnostics
- **Server Command Registration** — Removed `executeCommandProvider` from server capabilities to prevent double-registration of commands with client-side `registerCommand`

### Fixed
- **Bookmap in .ditamap Files** — Bookmaps using `.ditamap` extension no longer produce false "must have a `<map>` root element" error; both server and client delegate to bookmap-specific validation
- **SCH-023: Section Title False Positive** — Multiple-title-in-section rule now uses depth-tracking (`countDirectChildTitles`) to count only direct-child `<title>` elements, ignoring titles inside nested `<fig>`, `<div>`, `<table>`, `<example>`, etc.
- **SCH-040: Self-Closing Xref False Positive** — Nested xref detection now skips self-closing `<xref .../>` elements via negative lookbehind, preventing false error when sibling xrefs include self-closing ones
- **Glossentry Title Validation** — Glossentry topics correctly require `<glossterm>` (not `<title>`) as first child element
- **Bookmap Title Boundary Check** — Client-side `<booktitle>` and `<mainbooktitle>` checks use regex boundary matching (`/<booktitle[\s>]/`) instead of `includes()` to prevent false matches on substrings
- **Conditional Mainbooktitle Warning** — `<mainbooktitle>` warning only fires when `<booktitle>` exists (matches server-side logic)
- **ID Validation: Single Quotes** — `validateIDs` now handles `id='value'` via backreference regex, not just `id="value"`
- **Error Ranges** — Diagnostic underlines now span full line or exact match bounds instead of barely-visible 1-char-wide squiggles
- **Topicref Check: False Positives** — Self-closing `<topicref/>` elements and topicrefs with `conref`/`conkeyref` are correctly excluded from the missing-href warning
- **Code Action: Duplicate ID** — `fixDuplicateId` quick fix now handles single-quoted `id` attributes
- **DITA Explorer: Open File** — `ditacraft.openFile` command now has async error handling with user-facing warning
- **Completion: Invalid Position** — Element completion `startPos.character` clamped to 0 to prevent invalid negative LSP positions
- **XML Tokenizer: CRLF** — `advance()` now returns full `\r\n` for Windows line endings, fixing token text length mismatches
- **Package.json** — Added missing `ditacraft.openFile` command declaration
- **1087+ Total Tests** — Client (652) + Server (435)

## [0.6.0] - 2026-02-10

### Added
- **Activity Bar Views**: Dedicated DitaCraft sidebar with three tree views
  - **DITA Explorer**: Tree showing all workspace maps with expandable hierarchy
    - Type-specific icons (map, chapter, topic, keydef, appendix, part)
    - Click-to-open navigation, context menus (validate, publish, visualize)
    - Auto-refresh on file changes (debounced 500ms)
  - **Key Space View**: All defined keys grouped by status
    - Three groups: Defined Keys, Undefined Keys, Unused Keys
    - Expandable to show usage locations with navigation
    - Auto-refresh on file changes (debounced 1000ms)
  - **Diagnostics View**: Aggregated DITA validation issues
    - Group by file or by severity (errors, warnings, info, hints)
    - Auto-refresh on diagnostics changes (debounced 300ms)
    - Click-to-navigate to issue location
  - Welcome content for empty states (no maps, no keys, no diagnostics)

- **File Decoration Provider**: Error/warning badges on files in DITA Explorer tree
  - Reads from `vscode.languages.getDiagnostics()` for DITA files
  - Auto-updates on diagnostics changes

- **Shared Utilities**
  - `mapHierarchyParser.ts`: Extracted from MapVisualizerPanel for reuse by Explorer and Visualizer
  - `keyUsageScanner.ts`: Workspace-wide keyref/conkeyref scanner (up to 500 files)
  - `isDitaFilePath()` in constants.ts: Shared DITA file extension check

- **New Commands** (5)
  - `DITA: Refresh DITA Explorer` — Manual refresh for explorer view
  - `DITA: Refresh Key Space` — Manual refresh for key space view
  - `DITA: Refresh Diagnostics` — Manual refresh for diagnostics view
  - `DITA: Diagnostics: Group by File` — Switch diagnostics grouping
  - `DITA: Diagnostics: Group by Severity` — Switch diagnostics grouping

- **New Tests**: 72 new client tests across 5 test files
  - mapHierarchyParser.test.ts (25 tests)
  - ditaExplorerProvider.test.ts (14 tests)
  - keySpaceViewProvider.test.ts (10 tests)
  - diagnosticsViewProvider.test.ts (16 tests)
  - ditaFileDecorationProvider.test.ts (7 tests)
  - **Total: 620+ client tests, 810+ combined with server**

### Changed
- MapVisualizerPanel refactored to use shared `mapHierarchyParser.ts`
- Context menu commands (validate, publish, show map visualizer) now handle both URI and tree item arguments

### Fixed
- **Explorer Resilience**: `Promise.allSettled` instead of `Promise.all` — one bad map no longer hides all maps
- **Document Ordering**: Single-pass combined regex in `parseReferences` preserves document order
- **Windows Line Endings**: `offsetToPosition` in key scanner correctly handles `\r\n`
- **Comment Exclusion**: Both map parser and key scanner strip XML comments before regex matching
- **Memory Efficiency**: Key scanner uses `workspace.fs.readFile` for closed documents instead of opening all into memory

## [0.5.0] - 2026-02-08

### Added
- **DITA Language Server (LSP)**: Full-featured language server in a dedicated process
  - IntelliSense: context-aware element, attribute, and value completions (364 DITA elements)
  - Hover documentation from DITA schema with children fallback
  - Document symbols: hierarchical outline view (Ctrl+Shift+O)
  - Workspace symbols: cross-file symbol search (Ctrl+T)
  - Go to Definition for href/conref/keyref/conkeyref with key space resolution
  - Find References: locate all usages of an element ID across files
  - Rename: ID rename with automatic cross-file reference updates
  - XML formatting with inline/block/preformatted element handling
  - Code Actions: 5 quick fixes (missing DOCTYPE, ID, title, empty elements, duplicate IDs)
  - Linked Editing: simultaneous open/close XML tag name editing
  - Folding Ranges: collapse XML elements, comments, and CDATA blocks
  - Document Links: clickable href/conref/keyref links with key resolution
  - Diagnostics: XML well-formedness, DITA structure, and ID validation
  - Server-side key space resolution with BFS, TTL + LRU caching, debounced invalidation

- **DITAVAL Support**: Full language support for `.ditaval` files
  - Language registration and LSP document selector
  - 7 DITAVAL elements (val, prop, revprop, style-conflict, startflag, endflag, alt-text)
  - IntelliSense with DITAVAL-specific attributes (excludes DITA common attributes)
  - Hover documentation for all DITAVAL elements
  - Validation: root element check, XML well-formedness (skips DOCTYPE/title requirements)

- **cSpell Auto-Prompt**: Suggests cSpell configuration setup when cSpell extension is detected without config

- **Server Test Suite**: 190 standalone Mocha tests (94.3% statement coverage)
  - Validation (30 tests), Completions (19 tests), Hover (17 tests)
  - Symbols (21 tests), Code Actions (14 tests), Linked Editing (15 tests)
  - Reference Parser (40 tests), Formatting (20 tests), Folding (10 tests)

- **TypeScript Project References**: Proper multi-project setup for client + server

### Changed
- DITA schema expanded to 364 elements (from DTD files) with 43 attribute sets and 142 hover docs
- Root map discovery improved: searches all the way to workspace root, prefers highest-level maps
- `extractMapReferences` broadened to match any element with `.ditamap`/`.bookmap` href
- CI workflows split type-check and esbuild into separate steps for clearer error reporting
- `release.yml` uses `npm ci` instead of `npm install` for reproducible builds
- Server handler callbacks now have explicit LSP type annotations

### Fixed
- **Key Space Resolution**: `findRootMap()` no longer stops at first directory with maps
- **cSpell Setup Command**: Fixed path resolution bug when extension is esbuild-bundled
- **Client Key Space**: Added comment/CDATA stripping before regex extraction (was server-only)
- **CI Package Job**: Added missing `cd server && npm ci` step
- **Server Test Config**: `tsconfig.test.json` no longer inherits `composite: true` (prevents stale `.d.ts` emission)

## [0.4.2] - 2025-01-25

### Added
- **Rate Limiting**: DoS protection for validation operations
  - Sliding window rate limiter (10 requests/second per file for validation)
  - Configurable limits for different operation types (validation, file watcher, key space builds, preview)
  - Automatic cleanup of expired entries to prevent memory leaks
  - User-friendly warning message when rate limit exceeded

- **Modular Validation Engine Architecture**: Refactored validation system
  - Strategy pattern for swappable validation engines (TypesXML, Built-in, XMLLint)
  - Clean separation of concerns with dedicated engine classes
  - Fallback chain: TypesXML → Built-in when engine unavailable
  - Hot-swapping of engines when configuration changes

- **Architecture Documentation**: Comprehensive ARCHITECTURE.md
  - Layer architecture diagrams (Commands, Providers, Utils, External)
  - Data flow diagrams for validation, key resolution, and preview
  - Extension lifecycle documentation
  - Caching strategies and design patterns
  - Security considerations (XXE, path traversal, command injection)

- **Adaptive Cache Cleanup**: Performance optimization
  - Skip cache cleanup when caches are empty
  - Reduced unnecessary processing during idle periods

- **Enhanced Test Coverage**: 547+ tests (up from 491)
  - Rate limiter unit tests (17 tests)
  - Rate limiter integration tests (6 tests)
  - Security and edge case tests (16 tests)
  - Path traversal prevention tests
  - Cache expiration edge case tests
  - Large file handling tests

- **DITA User Guide**: Complete documentation in DITA format (`docs/user-guide/`)
  - 55 files organized as a bookmap with parts, chapters, and appendixes
  - Part I: Getting Started (Introduction, Installation)
  - Part II: Using DitaCraft (Commands, Features)
  - Part III: Configuration (Settings)
  - Appendix: Keyboard Shortcuts reference (all shortcuts with descriptions)
  - Glossary: 28 DITA and DitaCraft terms with cross-references
  - Index support via glossentry mechanism
  - Front matter with cover page, TOC, preface, and notices
  - Demonstrates DitaCraft capabilities (can be used as test content)

### Changed
- Validation command now includes rate limiting protection
- Auto-validation on save respects rate limits
- Centralized configuration access via configManager (P1-4 fix)
- Improved JSDoc documentation for complex functions

### Fixed
- **Preview Scroll Sync**: Fixed scroll sync for content smaller than viewport
  - Added scrollHeight > 0 guard to prevent scroll sync issues with short documents
  - Preview-to-editor sync now correctly handles non-scrollable content
- **Preview Print Mode**: Fixed toolbar injection for non-standard HTML
  - Added fallback for HTML without `<body>` tag (inserts after `</head>` or `<html>`)
  - Fixed critical bug where `<body>` could be incorrectly placed before `<head>`
  - Ensures valid HTML structure in all fallback scenarios
- Whitespace-only strings now handled correctly in error extraction (P3-3)
- Double disposal risk in provider factory eliminated (P2-2)

## [0.4.1] - 2025-01-25

### Added
- **TypesXML DTD Validation**: Full DTD validation using TypesXML (pure TypeScript)
  - 100% W3C XML Conformance Test Suite compliance
  - OASIS XML Catalog support for DITA public identifier resolution
  - No native dependencies required (works on all platforms without compilation)
  - Detects invalid elements (e.g., `<p>` in `<map>`), missing required attributes, content model violations
  - Graceful fallback to built-in validation if TypesXML unavailable

- **Three Validation Engines**: Configurable validation with engine selection
  - **TypesXML** (default, recommended): Full DTD validation, pure TypeScript
  - **Built-in**: Lightweight content model checking without full DTD
  - **xmllint**: External validation using libxml2 (requires installation)

- **TypesXML Validator Tests**: 15 new tests for DTD validation
  - Valid document tests (concept, topic, map, task, reference)
  - Invalid document detection (`<p>` in map, `<ul>` in map, `<topicref>` in concept)
  - Missing required attribute detection (id on topic)
  - Malformed XML detection
  - Integration tests with DitaValidator

### Changed
- Default validation engine changed from `xmllint` to `typesxml`
- Validation architecture improved to avoid duplicate errors when using TypesXML
- Content model validation skipped when TypesXML active (DTD covers it)
- Structure validation skips id/title checks when TypesXML active (DTD covers it)
- Test count increased from 476 to 491 passing tests

### Dependencies
- Added `typesxml` (^1.17.0) - Pure TypeScript XML/DTD validation with OASIS catalog support
- Removed `node-libxml` - No longer needed (had native compilation issues)

### Documentation
- Updated README.md with TypesXML validation details
- Updated ROADMAP.md with TypesXML completion status
- Created `docs/TYPESXML-DTD-VALIDATION-STUDY.md` with implementation research

## [0.2.2] - 2025-11-17

### Added
- **Cross-Reference (xref) Support**: Full navigation support for `<xref>` elements
  - Navigate `<xref href="file.dita">` to target files
  - Support for `<xref href="file.dita#element">` with fragment identifiers
  - Navigate `<xref keyref="keyname">` via key space resolution
  - Same-file navigation with `<xref href="#element">`
  - Smart tooltip indicating "cross-reference" type
  - Automatic skipping of external HTTP/HTTPS URLs

- **Related Link Element Support**: Navigation for `<link>` elements in related-links sections
  - Navigate `<link href="file.dita"/>` to target files
  - Support for fragments: `<link href="file.dita#element"/>`
  - Same-file links with `<link href="#element"/>`
  - Smart tooltip indicating "related link" type

- **Same-File Element Navigation**: Scroll-to-element support for `#element_id` references
  - Clicking on `conref="#element_id"` scrolls to target element
  - Clicking on `xref href="#element_id"` scrolls to target element
  - Clicking on `link href="#element_id"` scrolls to target element
  - Supports `topic_id/element_id` path format
  - Visual highlight on target element (2-second fade)
  - Cursor positioned at element location
  - Warning message if element not found

- **Key Reference Diagnostics**: Warning messages for missing key references
  - Automatic detection of undefined `keyref` and `conkeyref` attributes
  - Warning markers in editor for unresolved keys
  - Debounced validation to avoid excessive checking
  - Helpful message: "Key not found in key space. Make sure it's defined in a root map."
  - Integration with VS Code Problems panel

- **Enhanced Attribute Parsing**: Tooltips show @scope, @format, @type, @linktext, and @rev
  - `@scope` displayed as `[scope: local/peer/external]`
  - `@format` displayed as `[format: dita/pdf/html]`
  - `@type` displayed as `[type: concept/task/reference]`
  - `@linktext` displayed as `Link text: "custom text"`
  - `@rev` displayed as `[rev: 2.0]` for revision/version tracking
  - All attributes extracted and combined in enhanced tooltips

- **Enhanced Test Coverage**: Added 85+ new test cases
  - Cross-reference (xref) detection tests
  - Link element detection tests
  - Same-file element navigation tests
  - Element ID finding tests
  - Command URI generation tests
  - Fragment identifier handling tests
  - HTTP URL skipping tests
  - Mixed reference type tests
  - Enhanced attribute parsing tests (@scope, @format, @type, @linktext, @rev)
  - **Edge case handling** (13 new tests):
    - Empty attribute values (conref="", keyref="", scope="", etc.)
    - Malformed fragment identifiers (##, very long IDs)
    - Special characters in paths (spaces, unicode, parentheses)
    - Variable syntax skipping (${variable}/file.dita)
    - Case variations in attribute values
    - Whitespace handling in attributes

- **Updated Documentation**: DITA Reference Coverage Analysis
  - Coverage increased from 36% to **100%** (13/13 reference types fully implemented)
  - Full DITA reference type coverage achieved
  - Comprehensive coverage matrix and implementation notes
  - Added edge case test coverage documentation

### Changed
- **Reference Type Coverage**: Now supports all 13 major DITA reference types
  - @conref, @conkeyref, @keyref, @href, @scope, @format, @type, @linktext, @rev
  - `<xref>`, `<link>`, #fragment (same-file), @id (element navigator)
  - Improved from 4/11 to 13/13 fully implemented reference types (100%)
  - Same-file navigation now uses VS Code commands for proper scrolling

## [0.2.1] - 2025-11-17

### Fixed
- **Windows DITA-OT Support**: Fixed execution of .bat and .cmd files on Windows
  - DITA-OT verification now works correctly by executing through cmd.exe
  - Publishing now works on Windows with proper batch file handling
  - Resolves "DITA-OT path set, but verification failed" error
- **Title Validation**: Improved validation to check title as first child of root element
  - Now correctly detects missing title element even if title exists in nested elements
  - Validates that `<title>` must be direct child of topic/concept/task/reference
  - Better pattern matching for root element attributes (handles any order)
- **CI/CD Improvements**: Added VSIX artifact build to GitHub Actions workflow
  - Automatically builds and uploads VSIX on every push
  - Artifact includes commit SHA for easy identification
  - 30-day retention for downloadable artifacts

## [0.2.0] - 2025-11-16

### Added
- **Full Key Space Resolution**: Complete DITA key resolution support
  - Automatic root map discovery from workspace folders
  - Key space building from map hierarchies (maps, submaps, bookmaps)
  - Resolution of `@keyref`, `@conkeyref`, and key-based references
  - Intelligent caching with 1-minute TTL for performance
  - File watcher integration with 300ms debouncing
  - LRU eviction for cache memory management

- **Content Reference Navigation**: Enhanced Ctrl+Click support
  - Navigate `@conref` attributes to referenced content
  - Support for `file.dita#element_id` and `file.dita#topic_id/element_id` formats
  - Automatic path resolution relative to current file
  - Tooltip differentiation for conref, conkeyref, and keyref links

- **Enterprise Security Features**: Production-ready security hardening
  - XXE (XML External Entity) neutralization to prevent injection attacks
  - Path traversal protection with workspace bounds validation
  - Command injection prevention using `execFile()` instead of `exec()`
  - Input validation for all file system operations

- **Performance Optimizations**: Async operations and caching
  - Async file operations using `fs.promises` API to prevent UI blocking
  - Pre-compiled regex patterns for faster parsing
  - Root map caching to avoid repeated expensive directory scans
  - Debounced cache invalidation for file system events
  - Eliminated duplicate file reads in validation pipeline

- **Comprehensive Test Suite**: 144+ tests covering all features
  - Key space resolution tests with complex map hierarchies
  - Security tests for path traversal and XXE protection
  - Content reference and key reference navigation tests
  - Async operation and caching behavior tests

### Changed
- Upgraded test coverage from 65+ to 144+ tests
- Improved error handling with proper type annotations
- Enhanced tooltip messages to indicate reference type
- Better handling of Thenable vs Promise in VS Code API

### Fixed
- Promise rejection handling with proper `.catch()` wrappers
- TypeScript unused variable errors with underscore prefix convention
- DTD validation test fixtures with proper XML declarations and required elements
- Test reference consistency (element IDs matching test expectations)

### Security
- Added `neutralizeXXE()` method to strip external entity declarations
- Added `isPathWithinWorkspace()` for path traversal prevention
- Replaced `exec()` with `execFile()` to prevent shell injection
- Added workspace bounds validation before file operations

## [0.1.2] - 2025-02-03

### Added
- **Smart Navigation**: Ctrl+Click navigation in DITA maps and bookmaps
  - Click on `href` attributes in `<topicref>` elements to open referenced files
  - Works with relative paths and handles fragment identifiers (#topic_id)
  - Visual link indicators (underlined hrefs)
  - Hover tooltip showing target filename
  - Seamless navigation between maps and topics
- **DTD-Based Validation**: Complete DITA 1.3 DTD validation support
  - Bundled DITA 1.3 DTD files for all document types (topic, concept, task, reference, map, bookmap, learning, etc.)
  - DTD catalog resolver with PUBLIC ID mapping and caching
  - Validates against actual DITA specifications for required elements and attributes
  - Accurate error reporting with line and column information
- **Real-Time Validation**: Enhanced validation behavior
  - Validation on file open, save, and document change
  - 500ms debouncing for changes to prevent excessive validation
  - Auto-validation toggle via settings
- **Auto-Detection**: Intelligent DITA file detection
  - By extension: `.dita`, `.ditamap`, `.bookmap`
  - By DOCTYPE: Recognizes DITA DOCTYPE declarations in `.xml` files
- **Comprehensive Test Suite**: 60+ tests covering all key features
  - DTD validation tests (resolution, caching, validation)
  - Real-time validation tests (open, save, change, debouncing)
  - Command and auto-detection tests
  - Link navigation tests (Ctrl+Click, path resolution, edge cases)
  - TEST-COVERAGE.md documentation

### Changed
- Enhanced README.md with comprehensive feature documentation
- Updated project structure documentation
- Improved validation engine architecture with DTD support

### Dependencies
- Added `@xmldom/xmldom` for DTD-aware XML parsing

## [0.1.1] - 2025-02-01

### Changed
- **Preview Keyboard Shortcut**: Changed from `Ctrl+Shift+P` / `Cmd+Shift+P` to `Ctrl+Shift+H` / `Cmd+Shift+H` to avoid conflict with VS Code's Command Palette
- **Performance**: Implemented esbuild bundling to reduce extension size from 157 files to 13 files (~44 KB)

### Fixed
- Fixed CI build by upgrading to Node.js 20 (resolves `File is not defined` error)
- Configured ESLint to allow unused parameters prefixed with underscore

## [0.1.0] - 2025-01-27

### Added
- **DITA Language Support**
  - Syntax highlighting for `.dita`, `.ditamap`, and `.bookmap` files
  - Language configuration for DITA files
  - TextMate grammar for DITA syntax

- **Code Snippets**
  - 21 comprehensive DITA code snippets
  - Full document templates (Topic, Concept, Task, Reference, Map, Bookmap)
  - Content elements (paragraphs, sections, lists, tables, etc.)
  - Special elements (images, cross-references, notes, etc.)

- **Validation Features**
  - Real-time DITA file validation
  - XML syntax validation with two engines (xmllint and built-in parser)
  - DITA-specific structure validation
  - Auto-validation on save (configurable)
  - Inline error highlighting with diagnostics

- **Publishing Features**
  - Direct DITA-OT integration
  - Multi-format publishing (HTML5, PDF, EPUB, XHTML, htmlhelp, markdown)
  - Format selection dialog
  - Quick HTML5 publish command
  - HTML5 preview in external browser
  - Progress tracking with visual indicators
  - Custom DITA-OT arguments support

- **File Creation Commands**
  - Create new DITA topics (Topic, Concept, Task, Reference)
  - Create new DITA maps
  - Create new DITA bookmaps
  - Pre-filled templates with proper DOCTYPE declarations

- **Configuration Options**
  - DITA-OT path configuration
  - Default output format selection
  - Custom output directory with variable support
  - Validation engine selection
  - Auto-validation toggle
  - Preview auto-refresh toggle
  - Progress notifications toggle
  - Log level configuration
  - File and console logging options

- **Commands** (13 total)
  - `DITA: Validate Current File` - Validate DITA syntax and structure
  - `DITA: Publish (Select Format)` - Publish with format selection dialog
  - `DITA: Publish to HTML5` - Quick publish to HTML5
  - `DITA: Preview HTML5` - Preview HTML5 output
  - `DITA: Create New Topic` - Create new DITA topic with type selection
  - `DITA: Create New Map` - Create new DITA map
  - `DITA: Create New Bookmap` - Create new DITA bookmap
  - `DITA: Configure DITA-OT Path` - Set DITA-OT installation path
  - `DITA: Show Log File Location` - View log file location
  - `DITA: Open Log File` - Open log file in editor
  - `DITA: Show Output Channel` - Display DitaCraft output channel
  - `DITA: Clear Output Channel` - Clear output channel content
  - `DITA: Test Logger (Debug)` - Test logging functionality

- **Editor Integration**
  - Editor title bar icons for quick access
  - Context menu integration for DITA files
  - Keyboard shortcuts (Ctrl+Shift+V for validate, Ctrl+Shift+B for publish, Ctrl+Shift+P for preview)
  - Command Palette integration with context-aware visibility

- **Logging System**
  - Comprehensive logging to file and console
  - Configurable log levels (debug, info, warn, error)
  - Automatic log rotation (keeps 7 days)
  - Structured logging with timestamps and context
  - Log file management commands

### Fixed
- **Critical Path Handling**
  - Fixed preview and publishing failures when file paths contain spaces (e.g., "Learn Rust/project")
  - Added proper quoting around file paths in DITA-OT command arguments
  - Resolves "Failed to parse input file" errors with paths containing spaces

- **DITA Validation Improvements**
  - Fixed `<title>` validation to be an error (required by DTD) instead of warning
  - Fixed `id` attribute validation to be an error (required by DTD) instead of warning
  - Added validation for empty title elements
  - Enhanced error messages to include actual file paths

- **DTD Validation Enhancements**
  - Added `--valid` flag for proper DTD validation with xmllint
  - Added `--nonet` flag to prevent network access during validation
  - Set working directory for correct relative DTD path resolution

- **File Path Validation**
  - Added directory detection and rejection with clear error messages
  - Added file extension validation
  - Added empty path checks
  - Prevents DITA-OT from receiving directory paths instead of file paths

- **Error Logging and Debugging**
  - Added comprehensive console logging throughout preview and publish workflows
  - Added verbose output capture from DITA-OT
  - Improved error capture and reporting with full command line details
  - Better error messages for troubleshooting

- **README Updates**
  - Removed broken image references to non-existent screenshot files
  - Added "Recent Updates" section documenting all bug fixes

### Technical Details
- Built with TypeScript 5.2.2
- Requires VS Code 1.80.0 or higher
- Cross-platform support (Windows, macOS, Linux)
- No external extension dependencies
- MIT License
- Tested with DITA-OT 4.1.1

### Known Limitations
- HTML5 preview opens in external browser (WebView panel planned for future release)
- Publish error details shown in popup only (output channel integration planned)
- DITA-OT must be installed separately

---

## [Unreleased]

### Planned Features
- WebView-based HTML5 preview panel
- Enhanced error reporting in output channel
- Map navigation tree view
- Topic relationship visualization
- Built-in DITA-OT installer
- Support for DITA 2.0 specifications
- Ditaval filter file support
- Subject scheme validation
- External key scope resolution
- Same-file element navigation (scroll to `#element_id`)

---

**Note:** This is the initial release of DitaCraft. Please report any issues or feature requests on [GitHub](https://github.com/jyjeanne/ditacraft/issues).
