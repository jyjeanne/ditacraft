/**
 * The visual editor's menus as data (spec §13.3): the right-click menu, and the toolbar's
 * Insert and Table menus.
 *
 * The right-click menu works on the cursor (moved to the click first): quick fixes for a problem
 * at the cursor, a map row's actions (spec §13.8: open and change its target, edit its label,
 * indent, outdent), Add reference and relationship table commands in a map, clipboard, every block
 * element the DTD allows after the current block and every phrase element it allows at the
 * cursor — common ones first, the rest grouped by domain (the module of the element's class:
 * Programming, Software, User interface…) —, what the current paragraph can turn into, table
 * commands in a table, reused content actions on a reuse box, and actions on the element at
 * the cursor (select, move, remove its tags, delete, attributes, show in source).
 *
 * Items carry a ProseMirror command, or an action the page performs (clipboard, host
 * requests). `enabled` is decided here, for the state the menu was built for.
 *
 * Environment-neutral.
 */

import { type Command, type EditorState, NodeSelection } from 'prosemirror-state';
import type { DitaCommands } from './commands';
import type { ImageCommands, ImagePlacement } from './images';
import type { LinkCommands } from './links';
import type { MapCommands } from './mapCommands';
import type { RelTableCommands } from './relTables';
import type { EditorSchema } from './schema';
import type { TableCommands } from './tables';

/** What the page does for an item without a command (clipboard, or asking the host first). */
export type MenuAction = 'cut' | 'copy' | 'paste' | 'attributes' | 'showInSource' | 'reuseOpen' | 'reuseCopy'
    | 'imageInline' | 'imageBreak' | 'imageFigure' | 'imageReplace' | 'imageAlt' | 'link' | 'linkOpen' | 'quickFix' | 'rowOpen'
    | 'rowTarget' | 'rowLabel' | 'addReference';

export type MenuItem =
    | { kind: 'item'; id: string; label: string; enabled: boolean; command?: Command; action?: MenuAction; detail?: string }
    | { kind: 'submenu'; id: string; label: string; items: MenuItem[] }
    | { kind: 'heading'; label: string }
    | { kind: 'separator' };

export interface MenuContext {
    es: EditorSchema;
    cmds: DitaCommands;
    tables: TableCommands;
    images: ImageCommands;
    links: LinkCommands;
    /** The page can be edited (not read-only, the XML well-formed). */
    editable: boolean;
    /** The selection is reused content (conref, conkeyref). */
    reuse: boolean;
    /** The cursor is on a problem the page marks (its quick fixes can be listed). */
    problem?: boolean;
    /** A map row is selected; `target`: it points somewhere (Open target). */
    row?: { target: boolean };
    /** The document is a map: its rows' commands (spec §13.8). */
    maps?: MapCommands;
    /** The document is a map: its relationship tables' commands (spec §13.8, M3). */
    relTables?: RelTableCommands;
}

/**
 * Shown first, in this order, when allowed (at most COMMON_LIMIT of them). Highlighting (b, i…)
 * is on the toolbar and its shortcuts; it is in its domain here.
 */
export const COMMON_BLOCKS = ['p', 'step', 'ul', 'ol', 'note', 'codeblock', 'fig', 'table', 'simpletable', 'section', 'example', 'dl', 'lines', 'lq', 'steps',
    // Maps: the elements of a topic are not allowed there, so these come first.
    'topicref', 'chapter', 'topichead', 'topicgroup', 'keydef', 'mapref', 'part', 'appendix', 'reltable'];
export const COMMON_INLINE = ['xref', 'ph', 'keyword', 'term', 'uicontrol', 'wintitle', 'filepath', 'cmdname', 'userinput', 'codeph', 'q', 'systemoutput', 'varname'];
const COMMON_LIMIT = 10;

/** Above this many elements, a list is split into common ones and domains. */
const FLAT_LIMIT = 14;

/** The DITA module an element comes from: the part before "/" of its most specific class token. */
export function domainOf(es: EditorSchema, element: string): string {
    const tokens = es.facts(element)?.tokens ?? [];
    return tokens[tokens.length - 1]?.split('/')[0] ?? 'topic';
}

/** Elements grouped by domain: the base vocabulary first, then by name. */
export function groupByDomain(es: EditorSchema, names: string[]): { domain: string; label: string; names: string[] }[] {
    const groups = new Map<string, string[]>();
    for (const name of names) {
        const domain = domainOf(es, name);
        groups.set(domain, [...(groups.get(domain) ?? []), name]);
    }
    const label = (domain: string): string => es.labels.domains[domain] ?? domain;
    return [...groups.entries()]
        .map(([domain, list]) => ({ domain, label: label(domain), names: list.sort() }))
        .sort((a, b) => (a.domain === 'topic' ? -1 : b.domain === 'topic' ? 1 : a.label.localeCompare(b.label)));
}

/** A list of elements: flat when short, else the common ones, then one submenu per domain. */
export function elementItems(id: string, names: string[], common: string[], make: (name: string) => Command, ctx: MenuContext): MenuItem[] {
    const item = (name: string): MenuItem => ({ kind: 'item', id: `${id}/${name}`, label: name, enabled: ctx.editable, command: make(name) });
    if (names.length <= FLAT_LIMIT) {
        return [...names].sort().map(item);
    }
    const first = common.filter((n) => names.includes(n)).slice(0, COMMON_LIMIT);
    return [
        ...(first.length > 0 ? [{ kind: 'heading', label: ctx.es.labels.ui.common } as MenuItem, ...first.map(item), { kind: 'separator' } as MenuItem] : []),
        ...groupByDomain(ctx.es, names).map((g): MenuItem => ({ kind: 'submenu', id: `${id}/@${g.domain}`, label: g.label, items: g.names.map(item) })),
    ];
}

function ui(ctx: MenuContext, key: string): string {
    return ctx.es.labels.ui[key] ?? key;
}

function commandItem(ctx: MenuContext, state: EditorState, id: string, key: string, command: Command): MenuItem {
    return { kind: 'item', id, label: ui(ctx, key), enabled: ctx.editable && command(state), command };
}

/** Block elements to insert after the current block (toolbar Insert, and the context menu). */
export function insertItems(state: EditorState, ctx: MenuContext): MenuItem[] {
    const names = insertable(state, ctx);
    return elementItems('insert', names, COMMON_BLOCKS, (name) => (name === 'table' ? ctx.cmds.insertTable(2, 3)
        : name === 'reltable' && ctx.relTables ? ctx.relTables.insertRelTable(3, 1) : ctx.cmds.insertBlock(name)), ctx);
}

/** What Insert offers: the DTD's blocks after the current one — a relationship table's rows and cells excepted (its own commands keep the grid). */
function insertable(state: EditorState, ctx: MenuContext): string[] {
    const names = ctx.cmds.insertableAt(state);
    const rel = ctx.relTables;
    return rel ? names.filter((name) => !rel.isGridElement(name)) : names;
}

/** Table commands (toolbar Table, and the context menu in a table). */
export function tableItems(state: EditorState, ctx: MenuContext): MenuItem[] {
    const t = ctx.tables;
    const item = (id: string, key: string, command: Command) => commandItem(ctx, state, `table/${id}`, key, command);
    return [
        item('insertTable', 'insertTable', ctx.cmds.insertTable(2, 3)),
        { kind: 'heading', label: ui(ctx, 'rows') },
        item('rowAbove', 'rowAbove', t.addRow('before')),
        item('rowBelow', 'rowBelow', t.addRow('after')),
        item('deleteRow', 'deleteRow', t.deleteRow),
        item('headerRow', 'headerRow', t.toggleHeaderRow),
        { kind: 'heading', label: ui(ctx, 'columns') },
        item('columnLeft', 'columnLeft', t.addColumn('before')),
        item('columnRight', 'columnRight', t.addColumn('after')),
        item('deleteColumn', 'deleteColumn', t.deleteColumn),
        { kind: 'heading', label: ui(ctx, 'cells') },
        item('mergeRight', 'mergeRight', t.mergeRight),
        item('mergeDown', 'mergeDown', t.mergeDown),
        item('splitCell', 'splitCell', t.splitCell),
    ];
}

/** Relationship table commands (a map's toolbar, and the context menu in a relationship table). */
export function relTableItems(state: EditorState, ctx: MenuContext): MenuItem[] {
    const r = ctx.relTables;
    if (!r) {
        return [];
    }
    const item = (id: string, key: string, command: Command) => commandItem(ctx, state, `reltable/${id}`, key, command);
    return [
        item('insert', 'insertRelTable', r.insertRelTable(3, 1)),
        { kind: 'heading', label: ui(ctx, 'rows') },
        item('rowAbove', 'rowAbove', r.addRow('before')),
        item('rowBelow', 'rowBelow', r.addRow('after')),
        item('rowUp', 'moveRowUp', r.moveRow(-1)),
        item('rowDown', 'moveRowDown', r.moveRow(1)),
        item('deleteRow', 'deleteRow', r.deleteRow),
        { kind: 'heading', label: ui(ctx, 'columns') },
        item('columnLeft', 'columnLeft', r.addColumn('before')),
        item('columnRight', 'columnRight', r.addColumn('after')),
        item('deleteColumn', 'deleteColumn', r.deleteColumn),
    ];
}

/** Image placements (toolbar Image, and the context menu): the host asks for the file, then the page inserts it. */
export function imageItems(state: EditorState, ctx: MenuContext): MenuItem[] {
    const possible = ctx.images.placements(state);
    const item = (placement: ImagePlacement, key: string, action: MenuAction): MenuItem => ({
        kind: 'item', id: `image/${placement}`, label: ui(ctx, key), enabled: ctx.editable && possible.includes(placement), action,
    });
    return [
        item('inline', 'imageInText', 'imageInline'),
        item('break', 'imageOwnLine', 'imageBreak'),
        item('figure', 'imageInFigure', 'imageFigure'),
    ];
}

/** The right-click menu for the cursor (or selection) of `state`. */
export function contextMenu(state: EditorState, ctx: MenuContext): MenuItem[] {
    const { cmds } = ctx;
    const empty = state.selection.empty;
    const items: MenuItem[] = [
        ...(ctx.problem ? [
            { kind: 'item', id: 'quickFix', label: ui(ctx, 'quickFix'), enabled: ctx.editable, action: 'quickFix', detail: 'Ctrl+.' } as MenuItem,
            { kind: 'separator' } as MenuItem,
        ] : []),
        ...rowItems(state, ctx),
        { kind: 'item', id: 'cut', label: ui(ctx, 'cut'), enabled: ctx.editable && !empty, action: 'cut', detail: 'Ctrl+X' },
        { kind: 'item', id: 'copy', label: ui(ctx, 'copy'), enabled: !empty, action: 'copy', detail: 'Ctrl+C' },
        { kind: 'item', id: 'paste', label: ui(ctx, 'paste'), enabled: ctx.editable, action: 'paste', detail: 'Ctrl+V' },
        { kind: 'separator' },
    ];

    if (ctx.maps?.insertReference()(state)) {
        items.push({ kind: 'item', id: 'map/reference', label: ui(ctx, 'addReference'), enabled: ctx.editable, action: 'addReference' });
    }
    const insert = insertable(state, ctx);
    if (insert.length > 0) {
        items.push({ kind: 'submenu', id: 'insert', label: ui(ctx, 'insertAfter'), items: insertItems(state, ctx) });
    }
    const inline = cmds.inlineInsertableAt(state);
    if (inline.length > 0) {
        items.push({
            kind: 'submenu', id: 'inline', label: ui(ctx, empty ? 'insertInline' : 'wrapIn'),
            items: elementItems('inline', inline, COMMON_INLINE, (name) => cmds.insertInline(name), ctx),
        });
    }
    if (ctx.images.placements(state).length > 0) {
        items.push({ kind: 'submenu', id: 'image', label: ui(ctx, 'image'), items: imageItems(state, ctx) });
    }
    const onLink = ctx.links.linkAt(state) !== undefined;
    if (onLink || ctx.links.canInsert(state)) {
        items.push({ kind: 'item', id: 'link', label: ui(ctx, onLink ? 'changeLink' : 'link'), enabled: ctx.editable && ctx.links.setLink()(state), action: 'link', detail: 'Ctrl+K' });
    }
    if (onLink) {
        items.push(
            { kind: 'item', id: 'link/open', label: ui(ctx, 'openLink'), enabled: true, action: 'linkOpen' },
            commandItem(ctx, state, 'link/remove', 'removeLink', ctx.links.removeLink),
        );
    }
    const styles = cmds.blockTypesAt(state);
    if (styles.length > 0) {
        items.push({ kind: 'submenu', id: 'changeTo', label: ui(ctx, 'changeTo'), items: elementItems('changeTo', styles, COMMON_BLOCKS, (name) => cmds.setBlockType(name), ctx) });
    }
    if (ctx.relTables?.inRelTable(state)) {
        items.push({ kind: 'submenu', id: 'reltable', label: ui(ctx, 'relTable'), items: relTableItems(state, ctx).filter((i) => i.kind !== 'item' || i.id !== 'reltable/insert') });
    }
    if (ctx.tables.inTable(state)) {
        items.push({ kind: 'submenu', id: 'table', label: ui(ctx, 'table'), items: tableItems(state, ctx).filter((i) => i.kind !== 'item' || i.id !== 'table/insertTable') });
    }

    if (ctx.reuse) {
        items.push(
            { kind: 'separator' },
            { kind: 'heading', label: ui(ctx, 'reused') },
            { kind: 'item', id: 'reuse/open', label: ui(ctx, 'reuseOpen'), enabled: true, action: 'reuseOpen' },
            { kind: 'item', id: 'reuse/copy', label: ui(ctx, 'replaceWithCopy'), enabled: ctx.editable, action: 'reuseCopy' },
        );
    }

    const target = cmds.elementAt(state);
    if (target) {
        items.push(
            { kind: 'separator' },
            { kind: 'heading', label: `<${target.name}>` },
            ...(ctx.images.selectedImage(state) ? [
                { kind: 'item', id: 'image/replace', label: ui(ctx, 'replaceImage'), enabled: ctx.editable, action: 'imageReplace' } as MenuItem,
                { kind: 'item', id: 'image/alt', label: ui(ctx, 'altText'), enabled: ctx.editable, action: 'imageAlt' } as MenuItem,
            ] : []),
            commandItem(ctx, state, 'element/select', 'selectElement', cmds.selectElement),
            // A relationship table's rows, cells and header move with its own commands (they keep the grid).
            ...(ctx.relTables?.isGridPart(target.node) ? [] : [
                commandItem(ctx, state, 'element/up', 'moveUp', cmds.moveElement(-1)),
                commandItem(ctx, state, 'element/down', 'moveDown', cmds.moveElement(1)),
                commandItem(ctx, state, 'element/unwrap', 'unwrapElement', cmds.unwrapElement),
                commandItem(ctx, state, 'element/delete', 'deleteElement', cmds.deleteElement),
            ]),
            { kind: 'item', id: 'attributes', label: ui(ctx, 'attributes'), enabled: true, action: 'attributes' },
        );
    }
    items.push({ kind: 'item', id: 'showInSource', label: ui(ctx, 'showInSource'), enabled: true, action: 'showInSource' });
    return items;
}

/** A selected map row's items: its target (open, change), its label, its level (indent, outdent). */
function rowItems(state: EditorState, ctx: MenuContext): MenuItem[] {
    if (!ctx.row) {
        return [];
    }
    const maps = ctx.maps;
    const node = state.selection instanceof NodeSelection ? state.selection.node : undefined;
    const can = (command: Command | undefined): boolean => ctx.editable && command !== undefined && command(state);
    return [
        { kind: 'item', id: 'row/open', label: ui(ctx, 'openTarget'), enabled: ctx.row.target, action: 'rowOpen', detail: 'Enter' },
        ...(maps ? [
            { kind: 'item', id: 'row/target', label: ui(ctx, 'changeTarget'), enabled: ctx.editable && node !== undefined && maps.canTarget(node), action: 'rowTarget', detail: 'Ctrl+K' } as MenuItem,
            { kind: 'item', id: 'row/label', label: ui(ctx, 'editLabel'), enabled: ctx.editable && node?.isAtom === false, action: 'rowLabel', detail: 'F2' } as MenuItem,
            { kind: 'item', id: 'row/indent', label: ui(ctx, 'indentRow'), enabled: can(maps.indentRow), command: maps.indentRow, detail: 'Tab' } as MenuItem,
            { kind: 'item', id: 'row/outdent', label: ui(ctx, 'outdentRow'), enabled: can(maps.outdentRow), command: maps.outdentRow, detail: 'Shift+Tab' } as MenuItem,
        ] : []),
        { kind: 'separator' },
    ];
}

/** The item with `id` in a menu tree. */
export function findItem(items: MenuItem[], id: string): Extract<MenuItem, { kind: 'item' }> | undefined {
    for (const item of items) {
        if (item.kind === 'item' && item.id === id) {
            return item;
        }
        if (item.kind === 'submenu') {
            const found = findItem(item.items, id);
            if (found) {
                return found;
            }
        }
    }
    return undefined;
}
