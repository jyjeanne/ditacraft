# Third-Party Notices

This file contains notices and information required by third-party libraries and components used in DitaCraft.

---

## OASIS DITA 1.3 Grammar Files (DTDs)

This product includes DITA 1.3 grammar files (DTDs, entity files, and modules) from the OASIS Darwin Information Typing Architecture (DITA) Technical Committee.

**Copyright:**
```
Copyright (c) OASIS Open 2005, 2015. All rights reserved.
Copyright (c) IBM Corporation 2001, 2004. All rights reserved.
```

**Source:** https://docs.oasis-open.org/dita/dita/v1.3/

**License:** OASIS Intellectual Property Rights (IPR) Policy
- IPR Mode: RF on Limited Terms (Royalty-Free)
- https://www.oasis-open.org/policies-guidelines/ipr/

These grammar files are included to enable DTD-based validation of DITA documents within the extension. Use of these files for implementing the DITA standard is permitted under the OASIS IPR Policy.

---

## @xmldom/xmldom

**Version:** 0.8.x
**License:** MIT
**Repository:** https://github.com/xmldom/xmldom

```
MIT License

Copyright (c) 2019-present Christopher J. Brody and contributors
Copyright (c) 2012-2017 @jindw and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## fast-xml-parser

**Version:** 5.x
**License:** MIT
**Repository:** https://github.com/NaturalIntelligence/fast-xml-parser

```
MIT License

Copyright (c) 2017 Amit Kumar Gupta

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## DITA Editor (portions of the visual preview and visual editor)

Portions of the visual preview and visual editor are derived from DITA Editor: the
format-preserving XML concrete syntax tree (`src/shared/cst/`), CALS table and image rendering in
the HTML renderer (`src/shared/render/toHtml.ts`), the webview page shell
(`src/preview/pageHtml.ts`), the offset-to-element mapping (`src/shared/cst/elementIndex.ts`) and
the minimal span edit (`src/shared/editor/minimalEdit.ts`). Each derived file carries a notice
naming its origin and stating that DitaCraft modified it.

**Copyright:** Copyright 2026 Paul Razvan Sarbu
**License:** Apache License 2.0 — full text in [`LICENSE-THIRD-PARTY/apache-2.0.txt`](LICENSE-THIRD-PARTY/apache-2.0.txt)
**Repository:** https://github.com/sageata/dita-editor
**Upstream snapshot:** `dita-editor-main` source archive, package version 0.1.0 (changelog 0.1.14), files dated 2026-07-19; the archive carried no commit id.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use these files except
in compliance with the License. Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS
OF ANY KIND, either express or implied. See the License for the specific language governing
permissions and limitations under the License.

---

## ProseMirror

The visual editor's page (`out/webview/editor.js`) bundles ProseMirror: `prosemirror-model`,
`prosemirror-state`, `prosemirror-transform`, `prosemirror-view`, `prosemirror-commands`,
`prosemirror-history`, `prosemirror-keymap`, `prosemirror-gapcursor`, `prosemirror-dropcursor`, and
their dependencies `orderedmap`, `rope-sequence` and `w3c-keyname`. The editor stylesheet includes
the rules ProseMirror requires (from `prosemirror-view/style/prosemirror.css`).

**License:** MIT
**Repository:** https://github.com/ProseMirror

```
Copyright (C) 2015-2017 by Marijn Haverbeke <marijn@haverbeke.berlin> and others

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

---

## TypesXML

DTD parsing for validation (language server) and for compiling the visual preview's grammars.

**Copyright:** Copyright (c) 2023-2026 Maxprograms
**License:** Eclipse Public License 1.0 — https://www.eclipse.org/org/documents/epl-v10.html
**Repository (source code):** https://github.com/maxprograms-com/TypesXML

---

## DITA Open Toolkit (Optional Runtime Dependency)

If configured, DitaCraft can use DITA Open Toolkit for publishing and validation.

**License:** Apache License 2.0
**Repository:** https://github.com/dita-ot/dita-ot
**Website:** https://www.dita-ot.org/

DITA-OT is not bundled with this extension. Users must install it separately.
