/**
 * DITA-aware editing commands for the visual editor (spec §13.3).
 *
 * ProseMirror's stock commands assume HTML-like shapes (`list_item > paragraph`). DITA
 * elements come in variants here (schema.ts): a list item holding only text is itself a
 * textblock (`li__text`); one holding blocks is a container with `textrun`s. These commands
 * work on those shapes and on DITA semantics (class tokens), so they apply to every
 * specialization: Enter in a <step>'s <cmd> makes a new step, as Enter in an <li> makes a
 * new item.
 *
 * New elements carry no source id (attrs.src null): the serializer writes them as new.
 *
 * Environment-neutral (prosemirror-model/-state/-transform only).
 */

import { toggleMark } from 'prosemirror-commands';
import { Fragment, Mark, type Node as PMNode, type NodeType, type ResolvedPos } from 'prosemirror-model';
import { type Command, type EditorState, NodeSelection, Selection, TextSelection, type Transaction } from 'prosemirror-state';
import { canSplit } from 'prosemirror-transform';
import { SYNTHETIC, type EditorSchema, type ElementFacts, type TypeRole } from './schema';

const FRESH = { src: null, xml: [], view: null };

/** Elements whose Enter splits them in two (paragraphs, list items, definition parts). */
const SPLITTABLE = ['topic/p', 'topic/li', 'topic/sli', 'topic/dt', 'topic/dd'];
/** List items: Enter in their first line makes a new item; an empty item leaves the list. */
const ITEM = ['topic/li', 'topic/sli'];

export class DitaCommands {
    constructor(private readonly es: EditorSchema) {}

    // -- facts -----------------------------------------------------------------------------

    role(node: PMNode): TypeRole | undefined {
        return this.es.role(node.type);
    }

    factsOf(node: PMNode): ElementFacts | undefined {
        const element = this.role(node)?.element;
        return element ? this.es.facts(element) : undefined;
    }

    is(node: PMNode, tokens: string[]): boolean {
        const facts = this.factsOf(node);
        return facts !== undefined && tokens.some((t) => facts.tokens.includes(t));
    }

    isTextrun(node: PMNode): boolean {
        return node.type.name === SYNTHETIC.textrun;
    }

    /** The paragraph type (`p` as a plain textblock). */
    get paragraph(): NodeType | undefined {
        return this.es.nodeType('p', 'block', 'text');
    }

    /** The textblock variant to use for a new element of `element` (`p` → p__text). */
    textType(element: string): NodeType | undefined {
        return this.es.nodeType(element, 'block', 'text') ?? this.es.nodeType(element, 'block');
    }

    // -- Enter ----------------------------------------------------------------------------------

    /** Enter: split the element the cursor is in the DITA way (see module comment). */
    readonly enter: Command = (state, dispatch) => {
        const { $from, empty } = state.selection;
        if (!(state.selection instanceof TextSelection) || !$from.parent.isTextblock || $from.parent.type.spec.code) {
            return false;
        }
        const tr = state.tr;
        if (!empty) {
            tr.deleteSelection();
        }
        const $pos = tr.selection.$from;
        const block = $pos.parent;
        const done = (): boolean => {
            dispatch?.(tr.scrollIntoView());
            return true;
        };

        // An empty list item: leave the list (a paragraph after it).
        if (block.content.size === 0 && this.is(block, ITEM) && this.leaveList(tr, $pos)) {
            return done();
        }
        if (this.isTextrun(block)) {
            const container = $pos.node(-1);
            if (this.is(container, SPLITTABLE)) {
                const types = [{ type: container.type, attrs: FRESH }, { type: block.type }];
                if (canSplit(tr.doc, $pos.pos, 2, types)) {
                    tr.split($pos.pos, 2, types);
                    return done();
                }
            }
            // Text directly in a note, cell, section…: the rest becomes a paragraph.
            const p = this.paragraph;
            if (p && canSplit(tr.doc, $pos.pos, 1, [{ type: p, attrs: FRESH }])) {
                tr.split($pos.pos, 1, [{ type: p, attrs: FRESH }]);
                return done();
            }
            return false;
        }
        if (this.is(block, SPLITTABLE)) {
            const types = [{ type: block.type, attrs: FRESH }];
            if (canSplit(tr.doc, $pos.pos, 1, types)) {
                tr.split($pos.pos, 1, types);
                return done();
            }
        }
        // The leading line of an item (cmd in a step): a new item.
        const parent = $pos.depth > 1 ? $pos.node(-1) : undefined;
        if (parent && this.is(parent, ITEM)) {
            const types = [{ type: parent.type, attrs: FRESH }, { type: block.type, attrs: FRESH }];
            if (canSplit(tr.doc, $pos.pos, 2, types)) {
                tr.split($pos.pos, 2, types);
                return done();
            }
        }
        // Text of a note, cell, section… (its plain-text variant): keep the text before the
        // cursor as is and start a paragraph inside the element.
        if (this.role(block)?.variant === 'text' && this.splitIntoParagraph(tr, $pos)) {
            return done();
        }
        // A title, a short description…: start the next block after it.
        if (this.insertAfter(tr, $pos)) {
            return done();
        }
        return false;
    };

    /** `<note>abc|def</note>` → `<note>abc<p>def</p></note>` (the element becomes a container). */
    private splitIntoParagraph(tr: Transaction, $pos: ResolvedPos): boolean {
        const block = $pos.parent;
        const element = this.role(block)?.element;
        const container = element ? this.es.nodeType(element, 'block', 'main') : undefined;
        const p = this.paragraph;
        const textrun = this.es.schema.nodes[SYNTHETIC.textrun];
        if (!container || !p) {
            return false;
        }
        const offset = $pos.parentOffset;
        const before = block.content.cut(0, offset);
        const after = block.content.cut(offset);
        const children = [
            ...(before.size > 0 ? [textrun.create(null, before)] : []),
            p.create(FRESH, after),
        ];
        const content = Fragment.from(children);
        if (!container.validContent(content)) {
            return false;
        }
        const start = $pos.before();
        tr.replaceWith(start, $pos.after(), container.create(block.attrs, content));
        // Cursor at the start of the new paragraph.
        const pPos = start + 1 + (before.size > 0 ? before.size + 2 : 0);
        tr.setSelection(TextSelection.create(tr.doc, pPos + 1));
        return true;
    }

    /** Insert a new paragraph-like block after the textblock (or its nearest allowing ancestor). */
    private insertAfter(tr: Transaction, $pos: ResolvedPos): boolean {
        const candidates = ['shortdesc', 'p'].map((e) => this.textType(e)).filter((t): t is NodeType => t !== undefined);
        for (let d = $pos.depth - 1; d >= 0; d--) {
            const parent = $pos.node(d);
            const index = $pos.indexAfter(d);
            for (const type of candidates) {
                if (parent.canReplaceWith(index, index, type)) {
                    const at = $pos.after(d + 1);
                    tr.insert(at, type.create(FRESH));
                    tr.setSelection(TextSelection.create(tr.doc, at + 1));
                    return true;
                }
            }
        }
        return false;
    }

    /** An empty last item: removed, and a paragraph follows the list. */
    private leaveList(tr: Transaction, $pos: ResolvedPos): boolean {
        const list = $pos.node(-1);
        const listDepth = $pos.depth - 1;
        if ($pos.index(listDepth) !== list.childCount - 1 || list.childCount < 2 || listDepth < 1) {
            return false;
        }
        const p = this.paragraph;
        const grand = $pos.node(listDepth - 1);
        const index = $pos.indexAfter(listDepth - 1);
        if (!p || !grand.canReplaceWith(index, index, p)) {
            return false;
        }
        tr.delete($pos.before(), $pos.after());
        const at = tr.mapping.map($pos.after(listDepth));
        tr.insert(at, p.create(FRESH));
        tr.setSelection(TextSelection.create(tr.doc, at + 1));
        return true;
    }

    // -- lists ------------------------------------------------------------------------------------

    /** The list item around the selection: the item node and its depth. */
    itemAt($pos: ResolvedPos): { node: PMNode; depth: number } | undefined {
        for (let d = $pos.depth; d > 0; d--) {
            const node = $pos.node(d);
            if (this.is(node, ITEM)) {
                return { node, depth: d };
            }
        }
        return undefined;
    }

    /** Wrap the selected sibling blocks in a list (`ul`, `ol`…); each becomes an item. */
    wrapInList(listElement: string): Command {
        return (state, dispatch) => {
            const list = this.es.nodeType(listElement, 'block');
            const itemText = this.textType('li');
            const itemContainer = this.es.nodeType('li', 'block', 'main');
            const { $from, $to } = state.selection;
            const range = $from.blockRange($to, (node) => !node.isTextblock && !this.isTextrun(node) && node.type !== this.es.schema.topNodeType);
            if (!list || !itemText || !itemContainer || !range) {
                return false;
            }
            const items: PMNode[] = [];
            for (let i = range.startIndex; i < range.endIndex; i++) {
                const block = range.parent.child(i);
                if (this.is(block, ITEM)) {
                    return false; // already in a list
                }
                if (block.isTextblock) {
                    items.push(itemText.create(FRESH, block.content));
                } else if (itemContainer.validContent(Fragment.from(block))) {
                    items.push(itemContainer.create(FRESH, block));
                } else {
                    return false;
                }
            }
            const wrapped = list.create(FRESH, items);
            if (!range.parent.canReplaceWith(range.startIndex, range.endIndex, list) || !list.validContent(wrapped.content)) {
                return false;
            }
            if (dispatch) {
                const tr = state.tr.replaceWith(range.start, range.end, wrapped);
                tr.setSelection(Selection.near(tr.doc.resolve(range.start + 2)));
                dispatch(tr.scrollIntoView());
            }
            return true;
        };
    }

    /** The items of the list around the cursor become paragraphs again. */
    readonly unwrapList: Command = (state, dispatch) => {
        const item = this.itemAt(state.selection.$from);
        const p = this.paragraph;
        if (!item || !p || item.depth < 2) {
            return false;
        }
        const $pos = state.selection.$from;
        const list = $pos.node(item.depth - 1);
        const listStart = $pos.before(item.depth - 1);
        const grand = $pos.node(item.depth - 2);
        const index = $pos.index(item.depth - 2);
        const blocks: PMNode[] = [];
        list.forEach((li) => {
            if (li.isTextblock) {
                blocks.push(p.create(FRESH, li.content));
            } else {
                li.forEach((child) => blocks.push(this.isTextrun(child) ? p.create(FRESH, child.content) : child));
            }
        });
        const content = Fragment.from(blocks);
        if (!grand.canReplace(index, index + 1, content)) {
            return false;
        }
        if (dispatch) {
            const offset = $pos.pos - listStart;
            const tr = state.tr.replaceWith(listStart, listStart + list.nodeSize, content);
            tr.setSelection(Selection.near(tr.doc.resolve(Math.min(listStart + offset - 1, tr.doc.content.size))));
            dispatch(tr.scrollIntoView());
        }
        return true;
    };

    /** Tab: the item becomes the last item of a list nested in the previous item. */
    readonly indentItem: Command = (state, dispatch) => {
        const item = this.itemAt(state.selection.$from);
        if (!item || item.depth < 2) {
            return false;
        }
        const $pos = state.selection.$from;
        const list = $pos.node(item.depth - 1);
        const index = $pos.index(item.depth - 1);
        if (index === 0) {
            return false;
        }
        const prev = list.child(index - 1);
        const element = this.role(prev)?.element;
        const prevContainer = element ? this.es.nodeType(element, 'block', 'main') : undefined;
        const textrun = this.es.schema.nodes[SYNTHETIC.textrun];
        if (!prevContainer) {
            return false;
        }
        // The previous item as a container: its text becomes a run, followed by the nested list.
        const prevChildren: PMNode[] = [];
        if (prev.isTextblock) {
            if (prev.content.size > 0) {
                prevChildren.push(textrun.create(null, prev.content));
            }
        } else {
            prev.forEach((c) => prevChildren.push(c));
        }
        const last = prevChildren[prevChildren.length - 1];
        let nested: PMNode;
        if (last && last.type === list.type) {
            prevChildren.pop();
            nested = last.copy(last.content.append(Fragment.from(item.node)));
        } else {
            nested = list.type.create(FRESH, item.node);
        }
        prevChildren.push(nested);
        const newPrev = prevContainer.create(prev.attrs, prevChildren);
        if (!prevContainer.validContent(newPrev.content) || !list.type.validContent(nested.content)) {
            return false;
        }
        if (dispatch) {
            const prevStart = $pos.before(item.depth) - prev.nodeSize;
            const offsetInItem = $pos.pos - $pos.before(item.depth);
            const tr = state.tr.replaceWith(prevStart, $pos.after(item.depth), newPrev);
            const itemStart = prevStart + newPrev.nodeSize - 1 - 1 - item.node.nodeSize; // before the moved item
            tr.setSelection(Selection.near(tr.doc.resolve(Math.min(itemStart + offsetInItem, tr.doc.content.size))));
            dispatch(tr.scrollIntoView());
        }
        return true;
    };

    /** Shift+Tab: a nested item moves out, after the item that contains its list. */
    readonly outdentItem: Command = (state, dispatch) => {
        const item = this.itemAt(state.selection.$from);
        if (!item || item.depth < 4) {
            return false;
        }
        const $pos = state.selection.$from;
        const list = $pos.node(item.depth - 1);
        const parentItem = $pos.node(item.depth - 2);
        const outerList = $pos.node(item.depth - 3);
        if (!this.is(parentItem, ITEM) || outerList.type !== list.type) {
            return false;
        }
        const index = $pos.index(item.depth - 1);
        if (index !== list.childCount - 1) {
            return false; // only the last nested item (keeps the change simple and valid)
        }
        if (dispatch) {
            const offsetInItem = $pos.pos - $pos.before(item.depth);
            const tr = state.tr;
            const parentEnd = $pos.after(item.depth - 2);
            tr.insert(parentEnd, item.node);
            if (list.childCount === 1) {
                tr.delete($pos.before(item.depth - 1), $pos.after(item.depth - 1));
            } else {
                tr.delete($pos.before(item.depth), $pos.after(item.depth));
            }
            const at = tr.mapping.map(parentEnd, -1);
            tr.setSelection(Selection.near(tr.doc.resolve(Math.min(at + offsetInItem, tr.doc.content.size))));
            dispatch(tr.scrollIntoView());
        }
        return true;
    };

    // -- block types and insertion ------------------------------------------------------------------

    /** Element names the current textblock can be turned into (Styles). */
    blockTypesAt(state: EditorState): string[] {
        const { $from } = state.selection;
        if (!$from.parent.isTextblock || this.isTextrun($from.parent) || $from.depth < 1) {
            return [];
        }
        const parent = $from.node(-1);
        const index = $from.index(-1);
        const out: string[] = [];
        for (const name of Object.keys(this.es.grammar.elements)) {
            const type = this.textType(name);
            if (type?.isTextblock && type !== $from.parent.type && parent.canReplaceWith(index, index + 1, type) && this.allowedIn(parent, name)) {
                out.push(name);
            }
        }
        return out.sort();
    }

    /** Whether the DTD allows element `child` in `parent` (mixed models; the schema checks the rest). */
    allowedIn(parent: PMNode, child: string): boolean {
        const element = this.role(parent)?.element;
        return !element || this.es.allows(element, child);
    }

    /** Turn the current textblock into another element (its text kept; a new element). */
    setBlockType(element: string): Command {
        return (state, dispatch) => {
            const type = this.textType(element);
            const { $from, $to } = state.selection;
            if (!type?.isTextblock || !$from.parent.isTextblock || this.isTextrun($from.parent) || !$from.sameParent($to)) {
                return false;
            }
            const parent = $from.node(-1);
            if (!parent.canReplaceWith($from.index(-1), $from.index(-1) + 1, type) || !this.allowedIn(parent, element)) {
                return false;
            }
            if (dispatch) {
                dispatch(state.tr.setNodeMarkup($from.before(), type, FRESH).scrollIntoView());
            }
            return true;
        };
    }

    /**
     * Block elements that can be inserted after the current block, by the DTD (the strict
     * model of the container, even when the instance is loose).
     */
    insertableAt(state: EditorState): string[] {
        const target = this.insertionPointAt(state);
        if (!target) {
            return [];
        }
        const { parent, index } = target;
        const role = this.role(parent);
        const strict = (role?.element ? this.es.nodeType(role.element, 'block', 'main') : undefined) ?? parent.type;
        const at = offsetOf(parent, index);
        const out: string[] = [];
        for (const name of Object.keys(this.es.grammar.elements)) {
            const type = this.textType(name);
            if (!type || type.isInline || this.es.role(type)?.kind === 'opaque' || !this.allowedIn(parent, name)) {
                continue;
            }
            const content = parent.content.cut(0, at).append(Fragment.from(this.fill(type))).append(parent.content.cut(at));
            // By the DTD's model; an instance that already breaks it (loose) accepts any block.
            if (strict.validContent(content) || (role?.variant === 'loose' && parent.type.validContent(content))) {
                out.push(name);
            }
        }
        return out.sort();
    }

    /**
     * Where a new block goes: after the selected block (a map row, a block kept whole), else
     * after the block holding the cursor.
     */
    insertionPointAt(state: EditorState): { parent: PMNode; index: number; pos: number } | undefined {
        const selection = state.selection;
        if (selection instanceof NodeSelection && selection.node.isBlock) {
            const $pos = selection.$from;
            const parent = $pos.parent;
            if ($pos.depth === 0) {
                return undefined; // the root element
            }
            if (!parent.inlineContent && !this.isTextrun(parent)) {
                return { parent, index: $pos.index() + 1, pos: selection.to };
            }
        }
        return this.insertionPoint(selection.$from);
    }

    /** Where a new block goes: after the block holding the cursor, in its container. */
    insertionPoint($pos: ResolvedPos): { parent: PMNode; index: number; pos: number } | undefined {
        for (let d = $pos.depth - 1; d >= 0; d--) {
            const parent = $pos.node(d);
            if (parent.type === this.es.schema.topNodeType) {
                return undefined;
            }
            if (!parent.inlineContent && !this.isTextrun(parent)) {
                return { parent, index: $pos.indexAfter(d), pos: $pos.after(d + 1) };
            }
        }
        return undefined;
    }

    /** A new element with its required structure, text elements as plain textblocks. */
    fill(type: NodeType): PMNode {
        const node = type.createAndFill(FRESH) ?? type.create(FRESH);
        return this.preferText(node);
    }

    private preferText(node: PMNode): PMNode {
        if (node.isTextblock || node.isAtom || node.isText) {
            return node;
        }
        const role = this.role(node);
        if (role?.kind === 'mixed' && node.childCount === 0 && role.element) {
            const text = this.es.nodeType(role.element, 'block', 'text');
            if (text) {
                return text.create(node.attrs);
            }
        }
        const children: PMNode[] = [];
        node.forEach((c) => children.push(this.preferText(c)));
        return node.copy(Fragment.from(children));
    }

    /** Insert a new block element after the current block. */
    insertBlock(element: string, attrs: [string, string][] = []): Command {
        return (state, dispatch) => {
            const type = this.textType(element);
            const target = this.insertionPointAt(state);
            if (!type || !target) {
                return false;
            }
            const node = this.fill(type);
            const withAttrs = attrs.length > 0 ? node.type.create({ ...FRESH, xml: attrs }, node.content) : node;
            if (!target.parent.canReplaceWith(target.index, target.index, withAttrs.type) || !this.allowedIn(target.parent, element)) {
                return false;
            }
            if (dispatch) {
                const tr = state.tr.insert(target.pos, withAttrs);
                // The cursor in the new element's text; one with no text (a map row) is selected.
                tr.setSelection(hasText(withAttrs) || !NodeSelection.isSelectable(withAttrs)
                    ? Selection.near(tr.doc.resolve(target.pos + 1))
                    : NodeSelection.create(tr.doc, target.pos));
                dispatch(tr.scrollIntoView());
            }
            return true;
        };
    }

    /** A CALS table with a header row: `rows` body rows × `cols` columns. */
    insertTable(rows: number, cols: number): Command {
        return (state, dispatch) => {
            const t = (name: string, variant: 'main' | 'text' = 'main') => this.es.nodeType(name, 'block', variant);
            const [table, tgroup, colspec, thead, tbody, row, entry] = [t('table'), t('tgroup'), t('colspec'), t('thead'), t('tbody'), t('row'), t('entry', 'text')];
            const target = this.insertionPointAt(state);
            if (!table || !tgroup || !thead || !tbody || !row || !entry || !target) {
                return false;
            }
            const makeRow = () => row.create(FRESH, Array.from({ length: cols }, () => entry.create(FRESH)));
            const specs = colspec ? Array.from({ length: cols }, (_, i) => colspec.create({ ...FRESH, xml: [['colname', `c${i + 1}`], ['colnum', String(i + 1)], ['colwidth', '1*']] })) : [];
            const group = tgroup.create({ ...FRESH, xml: [['cols', String(cols)]] }, [
                ...specs,
                thead.create(FRESH, makeRow()),
                tbody.create(FRESH, Array.from({ length: Math.max(1, rows) }, makeRow)),
            ]);
            const node = table.create(FRESH, group);
            if (!table.validContent(node.content) || !target.parent.canReplaceWith(target.index, target.index, table) || !this.allowedIn(target.parent, 'table')) {
                return false;
            }
            if (dispatch) {
                const tr = state.tr.insert(target.pos, node);
                tr.setSelection(Selection.near(tr.doc.resolve(target.pos + 1)));
                dispatch(tr.scrollIntoView());
            }
            return true;
        };
    }

    // -- inline elements ----------------------------------------------------------------------------

    /** Elements the new inline element would be inside: the cursor's element, and its formatting. */
    inlineContext(state: EditorState): string[] | undefined {
        const { $from, $to } = state.selection;
        if (!$from.sameParent($to) || !$from.parent.inlineContent) {
            return undefined;
        }
        const holder = this.isTextrun($from.parent) ? $from.node(-1) : $from.parent;
        const element = this.role(holder)?.element;
        if (!element) {
            return undefined;
        }
        const marks = state.selection.empty ? (state.storedMarks ?? $from.marks()) : $from.marks();
        return [element, ...marks.map((m) => this.es.markElement(m.type)).filter((n): n is string => n !== undefined)];
    }

    /**
     * Phrase elements that can go at the cursor (or around the selection), by the DTD: allowed
     * in the element there and in the formatting around it, and able to hold text. Marks
     * (`b`, `i`…) and phrases (`ph`, `uicontrol`, `xref`…).
     */
    inlineInsertableAt(state: EditorState): string[] {
        const context = this.inlineContext(state);
        if (!context) {
            return [];
        }
        const out: string[] = [];
        for (const [name, el] of Object.entries(this.es.grammar.elements)) {
            const facts = this.es.facts(name);
            if (!facts || el.foreign || facts.placement === 'block' || facts.inlineKind === 'opaque' || !this.es.allowsText(name)) {
                continue;
            }
            if ((facts.mark || this.es.nodeType(name, 'inline')) && context.every((c) => this.es.allows(c, name))) {
                out.push(name);
            }
        }
        return out.sort();
    }

    /**
     * Insert a phrase element: around the selection (inside one paragraph), or — with no
     * selection — with its name as placeholder text, selected, to type over. Highlighting
     * elements toggle as formatting.
     */
    insertInline(element: string): Command {
        return (state, dispatch, view) => {
            if (!this.inlineInsertableAt(state).includes(element)) {
                return false;
            }
            const markType = this.es.markType(element);
            if (markType) {
                return toggleMark(markType)(state, dispatch, view);
            }
            const type = this.es.nodeType(element, 'inline');
            if (!type) {
                return false;
            }
            if (dispatch) {
                const { from, to, empty, $from } = state.selection;
                let marks: readonly Mark[];
                let inner: Fragment;
                if (empty) {
                    marks = state.storedMarks ?? $from.marks();
                    inner = Fragment.from(this.es.schema.text(element));
                } else {
                    // Formatting over the whole selection stays outside the new element.
                    const content = state.doc.slice(from, to).content;
                    marks = commonMarks(content);
                    inner = withoutMarks(content, marks);
                }
                const node = type.create(FRESH, inner, marks);
                const tr = state.tr.replaceWith(from, to, node);
                tr.setSelection(empty
                    ? TextSelection.create(tr.doc, from + 1, from + 1 + element.length)
                    : TextSelection.create(tr.doc, from + 1 + inner.size));
                dispatch(tr.scrollIntoView());
            }
            return true;
        };
    }

    // -- the element at the cursor ------------------------------------------------------------------

    /** The element the element actions apply to: the selected node, else the innermost element around the cursor. */
    elementAt(state: EditorState): { node: PMNode; pos: number; name: string } | undefined {
        const selection = state.selection;
        if (selection instanceof NodeSelection) {
            const name = this.role(selection.node)?.element ?? (typeof selection.node.attrs.name === 'string' ? selection.node.attrs.name : undefined);
            return name ? { node: selection.node, pos: selection.from, name } : undefined;
        }
        const $from = selection.$from;
        for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d);
            const name = this.role(node)?.element;
            if (name) {
                return { node, pos: $from.before(d), name };
            }
        }
        return undefined;
    }

    /** Select the element at the cursor (to copy, delete or edit it as a whole). */
    readonly selectElement: Command = (state, dispatch) => {
        const target = this.elementAt(state);
        if (!target || state.doc.resolve(target.pos).depth === 0 || !NodeSelection.isSelectable(target.node)) {
            return false;
        }
        if (dispatch) {
            dispatch(state.tr.setSelection(NodeSelection.create(state.doc, target.pos)).scrollIntoView());
        }
        return true;
    };

    /** Delete the element at the cursor, when its parent's model allows it to go. */
    readonly deleteElement: Command = (state, dispatch) => {
        const target = this.elementAt(state);
        const $pos = target ? state.doc.resolve(target.pos) : undefined;
        if (!target || !$pos || $pos.depth === 0) {
            return false;
        }
        const index = $pos.index();
        if (!$pos.parent.canReplace(index, index + 1, Fragment.empty)) {
            return false; // a required element (a topic's title, a list's only item)
        }
        if (dispatch) {
            const tr = state.tr.delete(target.pos, target.pos + target.node.nodeSize);
            tr.setSelection(Selection.near(tr.doc.resolve(Math.min(target.pos, tr.doc.content.size)), -1));
            dispatch(tr.scrollIntoView());
        }
        return true;
    };

    /** Swap the block at the cursor with the previous (-1) or next (1) one, when the model allows. */
    moveElement(direction: -1 | 1): Command {
        return (state, dispatch) => {
            const target = this.blockAt(state);
            const $pos = target ? state.doc.resolve(target.pos) : undefined;
            if (!target || !$pos || $pos.depth === 0) {
                return false;
            }
            const parent = $pos.parent;
            const index = $pos.index();
            const other = index + direction;
            if (other < 0 || other >= parent.childCount) {
                return false;
            }
            const sibling = parent.child(other);
            const [first, second] = direction === -1 ? [index - 1, index] : [index, index + 1];
            const swapped = direction === -1 ? Fragment.from([target.node, sibling]) : Fragment.from([sibling, target.node]);
            if (!parent.canReplace(first, second + 1, swapped)) {
                return false;
            }
            if (dispatch) {
                const start = direction === -1 ? target.pos - sibling.nodeSize : target.pos;
                const end = start + target.node.nodeSize + sibling.nodeSize;
                const moved = direction === -1 ? start : start + sibling.nodeSize;
                const tr = state.tr.replaceWith(start, end, swapped);
                const selection = state.selection;
                tr.setSelection(selection instanceof NodeSelection && selection.from === target.pos
                    ? NodeSelection.create(tr.doc, moved)
                    : Selection.near(tr.doc.resolve(moved + (selection.from - target.pos))));
                dispatch(tr.scrollIntoView());
            }
            return true;
        };
    }

    /** The block element the move commands apply to (a selected block, else the innermost block around the cursor). */
    private blockAt(state: EditorState): { node: PMNode; pos: number } | undefined {
        const selection = state.selection;
        if (selection instanceof NodeSelection) {
            return selection.node.isBlock ? { node: selection.node, pos: selection.from } : undefined;
        }
        const $from = selection.$from;
        for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d);
            if (node.isBlock && this.role(node)?.element) {
                return { node, pos: $from.before(d) };
            }
        }
        return undefined;
    }

    /**
     * Remove the element at the cursor but keep its content in its place (`<ph>a</ph>` → `a`,
     * a `<section>`'s blocks into its parent), when the parent's model takes that content.
     */
    readonly unwrapElement: Command = (state, dispatch) => {
        const target = this.elementAt(state);
        const $pos = target ? state.doc.resolve(target.pos) : undefined;
        if (!target || !$pos || $pos.depth === 0 || target.node.isAtom) {
            return false;
        }
        const { node } = target;
        const parent = $pos.parent;
        const index = $pos.index();
        let content: Fragment;
        if (node.isInline) {
            // Its formatting applies to its content.
            const children: PMNode[] = [];
            node.content.forEach((c) => children.push(c.mark(node.marks.reduce((set, m) => m.addToSet(set), c.marks))));
            content = Fragment.from(children);
        } else if (node.isTextblock) {
            content = node.content.size > 0 ? Fragment.from(this.es.schema.nodes[SYNTHETIC.textrun].create(null, node.content)) : Fragment.empty;
        } else {
            content = node.content;
        }
        // The parent's DTD model must take what moves into it: its elements, and text.
        const holder = this.isTextrun(parent) ? $pos.node(-1) : parent;
        const holderElement = this.role(holder)?.element;
        let allowed = true;
        const check = (c: PMNode): void => {
            const name = this.role(c)?.element;
            if (name) {
                allowed = allowed && this.allowedIn(holder, name);
            } else if (this.isTextrun(c)) {
                allowed = allowed && (!holderElement || this.es.allowsText(holderElement));
                c.forEach(check);
            }
        };
        content.forEach(check);
        if (!allowed || !parent.canReplace(index, index + 1, content)) {
            return false;
        }
        if (dispatch) {
            const tr = state.tr.replaceWith(target.pos, target.pos + node.nodeSize, content);
            const offset = state.selection.from - target.pos - 1;
            tr.setSelection(Selection.near(tr.doc.resolve(Math.max(0, Math.min(target.pos + Math.max(0, offset), tr.doc.content.size)))));
            dispatch(tr.scrollIntoView());
        }
        return true;
    };

    // -- normalization ---------------------------------------------------------------------------

    /**
     * Keep the document in the shapes the editor expects after any change: adjacent text runs
     * merge, an empty run beside blocks goes, and a block-mixed element left with only text
     * becomes its plain-text variant again. Returns null when nothing needs fixing.
     */
    normalize(state: EditorState): Transaction | null {
        const tr = state.tr;
        const fixes: { pos: number; node: PMNode }[] = [];
        state.doc.descendants((node, pos) => {
            const role = this.role(node);
            if (!role || role.kind !== 'mixed' || node.isTextblock) {
                return true;
            }
            const children: PMNode[] = [];
            let changed = false;
            node.forEach((child) => {
                const last = children[children.length - 1];
                if (this.isTextrun(child) && last && this.isTextrun(last)) {
                    children[children.length - 1] = last.copy(last.content.append(child.content));
                    changed = true;
                } else {
                    children.push(child);
                }
            });
            const pruned = children.filter((c) => !(this.isTextrun(c) && c.content.size === 0 && children.length > 1));
            changed = changed || pruned.length !== children.length;
            const textOnly = pruned.length <= 1 && pruned.every((c) => this.isTextrun(c));
            if (textOnly && role.element) {
                const text = this.es.nodeType(role.element, 'block', 'text');
                if (text) {
                    fixes.push({ pos, node: text.create(node.attrs, pruned[0]?.content ?? Fragment.empty) });
                    return false;
                }
            }
            if (changed) {
                fixes.push({ pos, node: node.copy(Fragment.from(pruned)) });
                return false;
            }
            return true;
        });
        if (fixes.length === 0) {
            return null;
        }
        for (const fix of fixes.reverse()) {
            const old = tr.doc.nodeAt(fix.pos);
            if (old) {
                tr.replaceWith(fix.pos, fix.pos + old.nodeSize, fix.node);
            }
        }
        return tr;
    }
}

/** Marks every inline node of `content` carries. */
export function commonMarks(content: Fragment): readonly Mark[] {
    let marks: readonly Mark[] | undefined;
    content.forEach((node) => {
        marks = marks === undefined ? node.marks : marks.filter((m) => m.isInSet(node.marks));
    });
    return marks ?? Mark.none;
}

export function withoutMarks(content: Fragment, marks: readonly Mark[]): Fragment {
    const out: PMNode[] = [];
    content.forEach((node) => out.push(node.mark(node.marks.filter((m) => !m.isInSet(marks)))));
    return Fragment.from(out);
}

/** Whether a node has a place for the cursor in text. */
function hasText(node: PMNode): boolean {
    if (node.isTextblock) {
        return true;
    }
    let found = false;
    node.descendants((child) => {
        found = found || child.isTextblock;
        return !found;
    });
    return found;
}

function offsetOf(parent: PMNode, index: number): number {
    let offset = 0;
    for (let i = 0; i < index; i++) {
        offset += parent.child(i).nodeSize;
    }
    return offset;
}
