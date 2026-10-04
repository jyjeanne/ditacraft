/**
 * Properties pane page script (spec §13.4). Bundled by esbuild to out/webview/properties.js.
 *
 * Renders what the host sends (the element chain at the cursor and the attribute fields of
 * the element shown) and sends back changes: an attribute set, cleared, or another element of
 * the chain chosen. Values are checked by the host; a refused change shows its reason.
 */

import type { HostToProperties, PropertiesState, PropertiesToHost } from '../../src/properties/messages';
import type { PropertyField, PropertyGroup } from '../../src/shared/editor/properties';

interface VsCodeApi {
    postMessage(message: unknown): void;
    setState(state: unknown): void;
    getState(): unknown;
}
declare function acquireVsCodeApi(): VsCodeApi;

const vscode = acquireVsCodeApi();
const root = document.getElementById('dc-properties') as HTMLElement;
const GROUPS: PropertyGroup[] = ['identity', 'profiling', 'common', 'element', 'architecture'];
const GROUP_LABEL: Record<PropertyGroup, string> = {
    identity: 'groupIdentity', profiling: 'groupProfiling', common: 'groupCommon', element: 'groupElement', architecture: 'groupArchitecture',
};

let state: PropertiesState | undefined;
/** Closed groups, remembered across refreshes and reloads. */
const closed = new Set<string>(((vscode.getState() as { closed?: string[] } | undefined)?.closed) ?? ['architecture']);

function post(message: PropertiesToHost): void {
    vscode.postMessage(message);
}

function t(key: string, ...args: string[]): string {
    const template = state?.ui[key] ?? key;
    return template.replace(/\{(\d+)\}/g, (whole, i: string) => args[Number(i)] ?? whole);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> & Record<string, unknown> = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
        if (key === 'dataset') {
            Object.assign(node.dataset, value as Record<string, string>);
        } else if (key.startsWith('aria-') || key === 'role' || key === 'for' || key === 'list') {
            node.setAttribute(key, String(value));
        } else {
            (node as unknown as Record<string, unknown>)[key] = value;
        }
    }
    node.append(...children);
    return node;
}

function set(field: PropertyField, value: string | null): void {
    if (!state?.element) {
        return;
    }
    if ((field.value ?? null) === value) {
        return;
    }
    post({ type: 'set', index: state.selected, element: state.element.name, name: field.name, value });
}

function describe(field: PropertyField): string {
    const parts = [field.type === 'enum' ? (field.values ?? []).join(' | ') : field.type];
    if (field.defaultValue !== null) {
        parts.push(t('defaultValue', field.defaultValue));
    }
    if (field.required) {
        parts.push(t('requiredField'));
    }
    if (field.fixed) {
        parts.push(t('fixedField'));
    }
    if (!field.declared) {
        parts.push(t('undeclared'));
    }
    return parts.join(' · ');
}

function control(field: PropertyField, editable: boolean, id: string): HTMLElement {
    if (!editable || field.readOnly) {
        return el('span', { className: 'dp-ro', id, title: field.value ?? '' }, field.value ?? (field.defaultValue !== null ? `(${field.defaultValue})` : ''));
    }
    if (field.type === 'enum' && field.values) {
        const select = el('select', { id, className: 'dp-input' });
        const none = field.defaultValue !== null ? `${t('notSet')} (${field.defaultValue})` : t('notSet');
        select.append(el('option', { value: '', textContent: none }));
        const values = field.value !== undefined && !field.values.includes(field.value) ? [...field.values, field.value] : field.values;
        for (const v of values) {
            select.append(el('option', { value: v, textContent: v }));
        }
        select.value = field.value ?? '';
        select.addEventListener('change', () => set(field, select.value === '' ? null : select.value));
        return select;
    }
    const suggestions = state?.suggestions[field.name] ?? [];
    const input = el('input', {
        id, className: 'dp-input', type: 'text', spellcheck: false, value: field.value ?? '',
        placeholder: field.defaultValue !== null ? t('defaultValue', field.defaultValue) : '',
    });
    const wrap = el('span', { className: 'dp-field' }, input);
    if (suggestions.length > 0) {
        const listId = `${id}-values`;
        input.setAttribute('list', listId);
        wrap.append(el('datalist', { id: listId }, ...suggestions.map((v) => el('option', { value: v }))));
        if (field.type === 'NMTOKENS' || field.type === 'CDATA') {
            // Profiling attributes hold several values: add one at a time.
            const add = el('select', { className: 'dp-add', title: '+' });
            add.append(el('option', { value: '', textContent: '+' }));
            const present = new Set((field.value ?? '').split(/\s+/).filter(Boolean));
            for (const v of suggestions.filter((s) => !present.has(s))) {
                add.append(el('option', { value: v, textContent: v }));
            }
            add.addEventListener('change', () => {
                if (add.value) {
                    set(field, [...present, add.value].join(' '));
                }
            });
            wrap.append(add);
        }
    }
    input.addEventListener('change', () => set(field, input.value === '' ? null : input.value));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            input.value = field.value ?? '';
            input.blur();
        }
    });
    return wrap;
}

function row(field: PropertyField, editable: boolean): HTMLElement {
    const id = `dp-${field.name.replace(/[^\w-]/g, '_')}`;
    const label = el('label', { for: id, className: 'dp-label', title: describe(field) }, field.name);
    if (field.required) {
        label.append(el('span', { className: 'dp-req', 'aria-label': t('requiredField') }, '*'));
    }
    const classes = ['dp-row'];
    if (field.value !== undefined) {
        classes.push('dp-set');
    }
    if (!field.declared) {
        classes.push('dp-undeclared');
    }
    const r = el('div', { className: classes.join(' '), dataset: { name: field.name } }, label, control(field, editable, id));
    if (editable && !field.readOnly && field.value !== undefined && !field.required) {
        const clear = el('button', { type: 'button', className: 'dp-clear', title: t('remove'), 'aria-label': `${t('remove')} ${field.name}` }, '×');
        clear.addEventListener('click', () => set(field, null));
        r.append(clear);
    }
    r.append(el('div', { className: 'dp-error', role: 'alert' }));
    return r;
}

function render(): void {
    if (!state) {
        return;
    }
    const s = state;
    const parts: HTMLElement[] = [];
    if (s.chain.length > 0) {
        const crumbs = el('nav', { className: 'dp-crumbs', 'aria-label': 'Elements' });
        // Outermost first, as a path.
        for (let i = s.chain.length - 1; i >= 0; i--) {
            const entry = s.chain[i];
            const b = el('button', { type: 'button', className: `dp-crumb${i === s.selected ? ' dp-current' : ''}`, textContent: entry.name });
            b.addEventListener('click', () => post({ type: 'select', index: i }));
            crumbs.append(b);
            if (i > 0) {
                crumbs.append(el('span', { className: 'dp-sep' }, '›'));
            }
        }
        parts.push(crumbs);
    }
    if (s.element) {
        const tokens = (s.element.cls ?? '').trim().split(/\s+/).filter((x) => x.includes('/'));
        parts.push(el('div', { className: 'dp-element' },
            el('span', { className: 'dp-name' }, s.element.name),
            el('span', { className: 'dp-class', title: s.element.cls ?? '' }, tokens.join(' '))));
        if (!s.element.editable && s.element.reason) {
            parts.push(el('div', { className: 'dp-note' }, s.element.reason));
        }
    }
    if (s.message) {
        parts.push(el('div', { className: 'dp-message' }, s.message));
    }
    const editable = s.element?.editable ?? false;
    for (const group of GROUPS) {
        const fields = s.fields.filter((f) => f.group === group);
        if (fields.length === 0) {
            continue;
        }
        const count = fields.filter((f) => f.value !== undefined).length;
        const details = el('details', { className: 'dp-group', open: !closed.has(group) },
            el('summary', {}, t(GROUP_LABEL[group]), count > 0 ? el('span', { className: 'dp-count' }, String(count)) : ''));
        details.addEventListener('toggle', () => {
            if (details.open) {
                closed.delete(group);
            } else {
                closed.add(group);
            }
            vscode.setState({ closed: [...closed] });
        });
        for (const field of fields) {
            details.append(row(field, editable));
        }
        parts.push(details);
    }
    // Keep focus on the field being edited across refreshes.
    const focused = document.activeElement instanceof HTMLElement ? document.activeElement.id : '';
    root.replaceChildren(...parts);
    if (focused) {
        document.getElementById(focused)?.focus();
    }
}

window.addEventListener('message', (event: MessageEvent<HostToProperties>) => {
    const message = event.data;
    if (message.type === 'state') {
        state = message.state;
        render();
    } else if (message.type === 'error') {
        const target = root.querySelector<HTMLElement>(`.dp-row[data-name="${CSS.escape(message.name)}"] .dp-error`);
        if (target) {
            target.textContent = message.message;
        } else {
            root.prepend(el('div', { className: 'dp-message dp-message-error' }, message.message));
        }
    }
});

post({ type: 'ready' });
