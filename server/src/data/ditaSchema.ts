/**
 * DITA schema data for IntelliSense features.
 * Defines content models, attributes, and documentation for DITA 1.3 elements.
 */

/** Parent element → allowed child elements */
export const DITA_ELEMENTS: Record<string, string[]> = {
    // Topic level
    topic: ['title', 'shortdesc', 'abstract', 'prolog', 'body', 'related-links', 'topic'],
    concept: ['title', 'shortdesc', 'abstract', 'prolog', 'conbody', 'related-links'],
    task: ['title', 'shortdesc', 'abstract', 'prolog', 'taskbody', 'related-links'],
    reference: ['title', 'shortdesc', 'abstract', 'prolog', 'refbody', 'related-links'],

    // Body elements
    body: ['p', 'ul', 'ol', 'dl', 'sl', 'section', 'table', 'simpletable', 'fig', 'note', 'codeblock', 'pre', 'lines', 'lq', 'image', 'xref'],
    conbody: ['p', 'ul', 'ol', 'dl', 'sl', 'section', 'table', 'simpletable', 'fig', 'note', 'codeblock', 'example'],
    taskbody: ['prereq', 'context', 'steps', 'steps-informal', 'steps-unordered', 'result', 'tasktroubleshooting', 'example', 'postreq'],
    refbody: ['refsyn', 'section', 'table', 'simpletable', 'properties', 'example'],

    // Block elements
    section: ['title', 'p', 'ul', 'ol', 'dl', 'table', 'simpletable', 'fig', 'note', 'codeblock', 'image', 'xref'],
    example: ['title', 'p', 'ul', 'ol', 'dl', 'table', 'simpletable', 'fig', 'note', 'codeblock'],
    fig: ['title', 'desc', 'image'],
    note: ['p', 'ul', 'ol'],
    lq: ['p'],

    // List elements
    ul: ['li'],
    ol: ['li'],
    dl: ['dlentry'],
    dlentry: ['dt', 'dd'],
    sl: ['sli'],
    li: ['p', 'ul', 'ol', 'dl', 'note', 'codeblock', 'image', 'xref', 'fig'],
    dd: ['p', 'ul', 'ol', 'dl', 'note', 'codeblock', 'image', 'xref', 'fig'],

    // Task elements
    steps: ['step', 'stepsection'],
    'steps-unordered': ['step', 'stepsection'],
    'steps-informal': ['p', 'ul', 'ol'],
    step: ['cmd', 'info', 'substeps', 'stepxmp', 'choices', 'choicetable', 'stepresult', 'steptroubleshooting'],
    substeps: ['substep'],
    substep: ['cmd', 'info', 'stepxmp', 'stepresult'],
    choices: ['choice'],
    choicetable: ['chhead', 'chrow'],
    chhead: ['choptionhd', 'chdeschd'],
    chrow: ['choption', 'chdesc'],
    prereq: ['p', 'ul', 'ol', 'note'],
    context: ['p', 'ul', 'ol', 'note'],
    result: ['p', 'ul', 'ol', 'note'],
    postreq: ['p', 'ul', 'ol', 'note'],

    // Table elements
    table: ['title', 'desc', 'tgroup'],
    tgroup: ['colspec', 'thead', 'tbody'],
    thead: ['row'],
    tbody: ['row'],
    row: ['entry'],
    simpletable: ['sthead', 'strow'],
    sthead: ['stentry'],
    strow: ['stentry'],

    // Prolog / metadata
    prolog: ['author', 'source', 'publisher', 'copyright', 'critdates', 'permissions', 'metadata', 'resourceid'],
    metadata: ['audience', 'category', 'keywords', 'prodinfo', 'othermeta'],
    keywords: ['keyword', 'indexterm'],
    'related-links': ['link', 'linklist', 'linkpool'],
    link: ['linktext', 'desc'],

    // Map elements
    map: ['title', 'topicmeta', 'topicref', 'mapref', 'keydef', 'reltable', 'topicgroup', 'topichead'],
    bookmap: ['title', 'booktitle', 'bookmeta', 'frontmatter', 'chapter', 'part', 'appendix', 'backmatter', 'reltable'],
    topicref: ['topicmeta', 'topicref'],
    chapter: ['topicmeta', 'topicref'],
    appendix: ['topicmeta', 'topicref'],
    part: ['topicmeta', 'chapter', 'appendix', 'topicref'],
    keydef: ['topicmeta'],
    topicmeta: ['navtitle', 'keywords', 'shortdesc', 'author', 'metadata'],
    frontmatter: ['topicref', 'booklists'],
    backmatter: ['topicref', 'booklists'],
    booktitle: ['booklibrary', 'mainbooktitle', 'booksubtitle'],
    reltable: ['relheader', 'relrow'],
    relheader: ['relcolspec'],
    relrow: ['relcell'],
    relcell: ['topicref'],
};

/** Common attributes shared by all DITA elements */
export const COMMON_ATTRIBUTES: string[] = [
    'id', 'conref', 'conkeyref', 'keyref', 'outputclass',
    'props', 'audience', 'platform', 'product', 'otherprops',
    'rev', 'status', 'importance', 'xml:lang', 'dir', 'translate',
];

/** Element-specific attributes (beyond common) */
export const ELEMENT_ATTRIBUTES: Record<string, string[]> = {
    topicref: ['href', 'keys', 'keyref', 'format', 'scope', 'type', 'navtitle', 'locktitle', 'collection-type', 'processing-role', 'toc', 'print'],
    keydef: ['keys', 'href', 'format', 'scope', 'processing-role'],
    xref: ['href', 'keyref', 'format', 'scope', 'type'],
    link: ['href', 'keyref', 'format', 'scope', 'type', 'role'],
    image: ['href', 'keyref', 'placement', 'scale', 'scalefit', 'width', 'height', 'align', 'alt'],
    note: ['type', 'spectitle'],
    codeblock: ['outputclass', 'scale', 'frame', 'expanse'],
    table: ['frame', 'colsep', 'rowsep', 'pgwide', 'rowheader'],
    tgroup: ['cols', 'colsep', 'rowsep', 'align'],
    colspec: ['colnum', 'colname', 'colwidth', 'colsep', 'rowsep', 'align'],
    entry: ['namest', 'nameend', 'morerows', 'colsep', 'rowsep', 'align', 'valign'],
    ph: ['keyref'],
    term: ['keyref'],
    keyword: ['keyref'],
    map: ['title', 'anchorref'],
    topic: ['id'],
    concept: ['id'],
    task: ['id'],
    reference: ['id'],
};

/** Attribute → allowed enumeration values */
export const ATTRIBUTE_VALUES: Record<string, string[]> = {
    type: ['note', 'tip', 'important', 'remember', 'restriction', 'caution', 'warning', 'danger', 'other'],
    scope: ['local', 'peer', 'external'],
    format: ['dita', 'ditamap', 'html', 'pdf', 'markdown'],
    placement: ['inline', 'break'],
    importance: ['obsolete', 'deprecated', 'optional', 'default', 'low', 'normal', 'high', 'recommended', 'required', 'urgent'],
    status: ['new', 'changed', 'deleted', 'unchanged'],
    translate: ['yes', 'no'],
    dir: ['ltr', 'rtl', 'lro', 'rlo'],
    'collection-type': ['choice', 'family', 'sequence', 'unordered'],
    'processing-role': ['normal', 'resource-only'],
    toc: ['yes', 'no'],
    print: ['yes', 'no', 'printonly'],
    locktitle: ['yes', 'no'],
    frame: ['all', 'bottom', 'none', 'sides', 'top', 'topbot'],
    colsep: ['0', '1'],
    rowsep: ['0', '1'],
    align: ['left', 'right', 'center', 'justify', 'char'],
    valign: ['top', 'middle', 'bottom'],
    role: ['parent', 'child', 'sibling', 'friend', 'next', 'previous', 'cousin', 'ancestor', 'descendant', 'other'],
};

/** Element documentation (markdown) for hover */
export const ELEMENT_DOCS: Record<string, string> = {
    topic: '**`<topic>`** — Base topic type\n\nUse when content doesn\'t fit concept, task, or reference.\n\n**Children:** title, shortdesc, prolog, body, related-links',
    concept: '**`<concept>`** — Conceptual information\n\nExplains what something is or how it works.\n\n**Children:** title, shortdesc, prolog, conbody, related-links',
    task: '**`<task>`** — Procedural information\n\nStep-by-step instructions for completing a procedure.\n\n**Children:** title, shortdesc, prolog, taskbody, related-links',
    reference: '**`<reference>`** — Reference information\n\nDetailed lookup information like API docs or command specs.\n\n**Children:** title, shortdesc, prolog, refbody, related-links',
    title: '**`<title>`** — Element title\n\nRequired first child of topics, sections, tables, and figures.',
    shortdesc: '**`<shortdesc>`** — Short description\n\nBrief summary that appears in link previews and search results.',
    body: '**`<body>`** — Topic body\n\nContains the main content of a generic topic.\n\n**Children:** p, ul, ol, dl, section, table, fig, note, codeblock',
    conbody: '**`<conbody>`** — Concept body\n\nContains conceptual content.\n\n**Children:** p, ul, ol, dl, section, table, fig, note, example',
    taskbody: '**`<taskbody>`** — Task body\n\nContains procedural content with steps.\n\n**Children:** prereq, context, steps, result, example, postreq',
    refbody: '**`<refbody>`** — Reference body\n\nContains reference content.\n\n**Children:** refsyn, section, table, properties, example',
    section: '**`<section>`** — Section within a topic body\n\nOrganizational division. Cannot be nested.',
    p: '**`<p>`** — Paragraph\n\nBasic block-level text container.',
    note: '**`<note>`** — Note\n\nAdditional information that stands out from body text.\n\n**Types:** note, tip, important, remember, restriction, caution, warning, danger',
    ul: '**`<ul>`** — Unordered list\n\n**Children:** li',
    ol: '**`<ol>`** — Ordered list\n\n**Children:** li',
    li: '**`<li>`** — List item\n\nCan contain paragraphs, lists, and other block elements.',
    dl: '**`<dl>`** — Definition list\n\n**Children:** dlentry (each with dt and dd)',
    table: '**`<table>`** — CALS table\n\nFormal table with optional title and column specifications.\n\n**Children:** title, desc, tgroup',
    simpletable: '**`<simpletable>`** — Simple table\n\nLightweight table without column specifications.\n\n**Children:** sthead, strow',
    fig: '**`<fig>`** — Figure\n\nA titled image or illustration.\n\n**Children:** title, desc, image',
    image: '**`<image>`** — Image reference\n\nInline or block image. Use `placement="break"` for block display.\n\n**Attributes:** href, keyref, placement, width, height, alt',
    xref: '**`<xref>`** — Cross-reference\n\nLink to another topic or external resource.\n\n**Attributes:** href, keyref, format, scope',
    codeblock: '**`<codeblock>`** — Code block\n\nPreformatted code. Use `outputclass="language-xxx"` for syntax highlighting.',
    steps: '**`<steps>`** — Ordered steps\n\nContains step elements for a procedure.\n\n**Children:** step, stepsection',
    step: '**`<step>`** — Single step\n\nA step in a task procedure.\n\n**Required:** cmd\n\n**Optional:** info, substeps, stepxmp, choices, stepresult',
    cmd: '**`<cmd>`** — Step command\n\nThe action the user must perform. Required in every step.',
    prereq: '**`<prereq>`** — Prerequisites\n\nConditions that must be met before starting the task.',
    context: '**`<context>`** — Task context\n\nBackground information for the task.',
    result: '**`<result>`** — Expected result\n\nWhat the user should see after completing the steps.',
    example: '**`<example>`** — Example\n\nIllustrative content supporting the topic.',
    prolog: '**`<prolog>`** — Topic metadata\n\nContains author, copyright, keywords, and other metadata.',
    'related-links': '**`<related-links>`** — Related links section\n\nLinks to related topics.\n\n**Children:** link, linklist, linkpool',
    link: '**`<link>`** — Related link\n\n**Attributes:** href, keyref, format, scope, role',
    map: '**`<map>`** — DITA map\n\nDefines a collection of topics and their relationships.\n\n**Children:** title, topicmeta, topicref, keydef, reltable',
    bookmap: '**`<bookmap>`** — Book map\n\nSpecialized map for book-like publications.\n\n**Children:** title, booktitle, chapter, part, appendix, backmatter',
    topicref: '**`<topicref>`** — Topic reference\n\nReference to a topic within a map.\n\n**Attributes:** href, keys, format, scope, type',
    keydef: '**`<keydef>`** — Key definition\n\nDefines a key for indirect referencing.\n\n**Attributes:** keys, href, format, scope',
    conref: '**`conref`** attribute — Content reference\n\nPulls content from another element by ID.\n\n**Format:** `filename.dita#topicid/elementid`',
    keyref: '**`keyref`** attribute — Key reference\n\nReferences content via an indirect key.\n\nKey must be defined in a map via `<keydef>`.',
};
