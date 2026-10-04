/**
 * Visual Preview page script (spec §8.2). Runs inside the webview; bundled by esbuild to
 * out/webview/preview.js.
 *
 * Responsibilities: swap the rendered body in place (keeping the reading position), apply
 * element patches, paint problem marks, scroll to elements the editor points at, report
 * the top-most visible element and clicks back to the host, and drive the toolbar,
 * banner and status line. All content comes from the host; nothing is fetched here.
 */

import type { DocMeta, HostToWebview, OpenKind, PreviewSettings, Problem, ToolbarCommand, WebviewToHost } from '../../src/preview/messages';

interface VsCodeApi {
    postMessage(message: unknown): void;
    setState(state: unknown): void;
    getState(): unknown;
}

declare function acquireVsCodeApi(): VsCodeApi;

const vscode = acquireVsCodeApi();
const toolbar = document.getElementById('dc-toolbar') as HTMLElement;
const banner = document.getElementById('dc-banner') as HTMLElement;
const content = document.getElementById('dc-content') as HTMLElement;
const status = document.getElementById('dc-status') as HTMLElement;

let settings: PreviewSettings = { pageWidth: 760, showMarkup: false, syncEnabled: true, locked: false, theme: 'auto', ui: {} };
let meta: DocMeta | undefined;
let version = 0;
let problems: Problem[] = [];
let problemCursor = -1;
let selected: HTMLElement | undefined;
let lastReportedTop: string | undefined;
let suppressScrollUntil = 0;

const ECHO_MS = 400;

function post(message: WebviewToHost): void {
    vscode.postMessage(message);
}

function t(key: string, ...args: (string | number)[]): string {
    const template = settings.ui[key] ?? key;
    return template.replace(/\{(\d+)\}/g, (whole, i: string) => (args[Number(i)] !== undefined ? String(args[Number(i)]) : whole));
}

function byId(id: string): HTMLElement | null {
    return content.querySelector<HTMLElement>(`[data-struct-id="${id}"]`);
}

function firstPresent(ids: string[]): HTMLElement | null {
    for (const id of ids) {
        const el = byId(id);
        if (el) {
            return el;
        }
    }
    return null;
}

function toolbarHeight(): number {
    return toolbar.getBoundingClientRect().height;
}

// ---------------------------------------------------------------------------------------------
// Toolbar, banner, status

function button(label: string, command: ToolbarCommand, title: string, pressed?: boolean): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dc-btn';
    b.textContent = label;
    b.title = title;
    b.dataset.command = command;
    if (pressed !== undefined) {
        b.setAttribute('aria-pressed', String(pressed));
    }
    return b;
}

function renderToolbar(): void {
    const themeName = settings.theme === 'auto' ? 'Auto' : settings.theme === 'light' ? 'Light' : 'Dark';
    toolbar.replaceChildren(
        button(t('refresh'), 'refresh', t('refresh')),
        button(t('openSource'), 'openSource', t('openSource')),
        button(settings.showMarkup ? t('hideMarkup') : t('showMarkup'), 'toggleMarkup', t('showMarkup'), settings.showMarkup),
        button(settings.syncEnabled ? t('syncOn') : t('syncOff'), 'toggleSync', t('syncOn'), settings.syncEnabled),
        button(t('theme', themeName), 'cycleTheme', t('theme', themeName)),
        button(settings.locked ? t('unlock') : t('lock'), 'toggleLock', settings.locked ? t('locked') : t('follow'), settings.locked),
        Object.assign(document.createElement('span'), { className: 'dc-spacer' }),
        button(t('previewDitaOt'), 'previewDitaOt', t('previewDitaOt')),
    );
}

toolbar.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-command]');
    if (target?.dataset.command) {
        post({ type: 'command', command: target.dataset.command as ToolbarCommand });
    }
});

function showBanner(kind: 'parse' | 'info' | null, text?: string, line?: number): void {
    if (!kind || !text) {
        banner.hidden = true;
        banner.replaceChildren();
        return;
    }
    banner.hidden = false;
    banner.className = `dc-banner dc-banner-${kind}`;
    const message = document.createElement(kind === 'parse' && line ? 'button' : 'span');
    message.textContent = text;
    if (kind === 'parse' && line) {
        (message as HTMLButtonElement).type = 'button';
        message.className = 'dc-banner-link';
        message.addEventListener('click', () => post({ type: 'open', version, kind: 'line', line }));
    }
    banner.replaceChildren(message);
}

function renderStatus(): void {
    const items: HTMLElement[] = [];

    const crumbs = document.createElement('nav');
    crumbs.className = 'dc-crumbs';
    crumbs.setAttribute('aria-label', 'Breadcrumb');
    const chain: HTMLElement[] = [];
    for (let el: HTMLElement | null = selected ?? null; el && el !== content; el = el.parentElement) {
        if (el.dataset.dita && el.dataset.structId) {
            chain.unshift(el);
        }
    }
    chain.forEach((el, i) => {
        if (i > 0) {
            crumbs.append(Object.assign(document.createElement('span'), { className: 'dc-crumb-sep', textContent: '›' }));
        }
        const crumb = document.createElement('button');
        crumb.type = 'button';
        crumb.className = 'dc-crumb';
        const name = el.dataset.dita ?? '';
        crumb.textContent = name.charAt(0).toUpperCase() + name.slice(1);
        crumb.addEventListener('click', () => selectElement(el, true));
        crumbs.append(crumb);
    });
    items.push(crumbs);

    const spacer = document.createElement('span');
    spacer.className = 'dc-spacer';
    items.push(spacer);

    if (meta) {
        const count = problems.length;
        const problemButton = document.createElement('button');
        problemButton.type = 'button';
        problemButton.className = `dc-status-item dc-problems${count > 0 ? ' dc-has-problems' : ''}`;
        problemButton.textContent = count === 0 ? t('noProblems') : count === 1 ? `⚠ ${t('oneProblem')}` : `⚠ ${t('problems', count)}`;
        problemButton.disabled = count === 0;
        problemButton.addEventListener('click', nextProblem);
        items.push(problemButton);

        // The map the topic is shown in (spec §13.8 M4): click to choose another.
        if (meta.context) {
            const context = Object.assign(document.createElement('button'), {
                type: 'button', className: 'dc-status-item dc-context', textContent: `🗺 ${meta.context.label}`, title: meta.context.title,
            });
            context.addEventListener('click', () => post({ type: 'command', command: 'chooseContext' }));
            items.push(context);
        }
        const grammar = Object.assign(document.createElement('span'), {
            className: `dc-status-item${meta.fallback ? ' dc-fallback' : ''}`,
            textContent: meta.grammarLabel,
        });
        items.push(grammar);
        items.push(Object.assign(document.createElement('span'), {
            className: 'dc-status-item',
            textContent: meta.ditaval ? t('filter', meta.ditaval) : t('noFilter'),
        }));
        items.push(Object.assign(document.createElement('span'), { className: 'dc-status-item dc-file', textContent: meta.fileName }));
    }
    status.replaceChildren(...items);
}

// ---------------------------------------------------------------------------------------------
// Content

function applyProblems(): void {
    for (const el of content.querySelectorAll<HTMLElement>('.dc-problem')) {
        el.classList.remove('dc-problem', 'dc-problem-error', 'dc-problem-warning', 'dc-problem-info');
        if (el.dataset.dcTitle !== undefined) {
            el.title = el.dataset.dcTitle;
            delete el.dataset.dcTitle;
        } else {
            el.removeAttribute('title');
        }
    }
    const messages = new Map<HTMLElement, string[]>();
    for (const problem of problems) {
        const el = firstPresent(problem.ids);
        if (!el) {
            continue;
        }
        el.classList.add('dc-problem', `dc-problem-${problem.severity === 'hint' ? 'info' : problem.severity}`);
        const list = messages.get(el) ?? [];
        list.push(`${problem.severity.toUpperCase()} (line ${problem.line}): ${problem.message}${problem.code ? ` [${problem.code}]` : ''}`);
        messages.set(el, list);
    }
    for (const [el, list] of messages) {
        if (el.dataset.dcTitle === undefined) {
            el.dataset.dcTitle = el.getAttribute('title') ?? '';
        }
        el.title = list.join('\n');
        el.setAttribute('aria-description', list.join('. '));
    }
}

function nextProblem(): void {
    const present = problems.map((p) => firstPresent(p.ids)).filter((el): el is HTMLElement => el !== null);
    if (present.length === 0) {
        return;
    }
    problemCursor = (problemCursor + 1) % present.length;
    const el = present[problemCursor];
    el.scrollIntoView({ block: 'center' });
    flash(el);
    selectElement(el, false);
}

function enhanceImages(root: ParentNode): void {
    for (const img of root.querySelectorAll<HTMLImageElement>('img')) {
        img.addEventListener('error', () => img.classList.add('dc-broken-image'), { once: true });
        const scale = Number(img.dataset.scale);
        if (scale > 0) {
            const apply = () => {
                if (img.naturalWidth > 0) {
                    img.style.width = `${(img.naturalWidth * scale) / 100}px`;
                }
            };
            if (img.complete) {
                apply();
            } else {
                img.addEventListener('load', apply, { once: true });
            }
        }
    }
}

function flash(el: HTMLElement): void {
    el.classList.remove('dc-flash');
    void el.offsetWidth; // restart the animation
    el.classList.add('dc-flash');
}

/** The innermost element with an id at the top of the visible page. */
function topVisibleId(): string | undefined {
    const page = content.getBoundingClientRect();
    const y = toolbarHeight() + 12;
    for (const x of [page.left + 24, page.left + page.width / 2]) {
        const hit = document.elementFromPoint(x, y);
        const el = hit?.closest<HTMLElement>('[data-struct-id]');
        if (el && content.contains(el)) {
            return el.dataset.structId;
        }
    }
    // Between blocks: the first element whose box reaches below the toolbar.
    for (const el of content.querySelectorAll<HTMLElement>('[data-struct-id]')) {
        if (el.getBoundingClientRect().bottom > y) {
            return el.dataset.structId;
        }
    }
    return undefined;
}

function selectElement(el: HTMLElement, notifyHost: boolean): void {
    selected?.classList.remove('dc-selected');
    selected = el;
    el.classList.add('dc-selected');
    renderStatus();
    if (notifyHost && el.dataset.structId) {
        post({ type: 'select', version, id: el.dataset.structId });
    }
}

function setBody(html: string, anchor: string | undefined): void {
    const anchorId = anchor ?? topVisibleId();
    const before = anchorId ? byId(anchorId)?.getBoundingClientRect().top : undefined;
    const selectedId = selected?.dataset.structId;
    content.classList.remove('dc-empty');
    content.innerHTML = html;
    enhanceImages(content);
    selected = selectedId ? byId(selectedId) ?? undefined : undefined;
    selected?.classList.add('dc-selected');
    if (anchorId) {
        const el = byId(anchorId);
        if (el) {
            suppressScrollUntil = Date.now() + ECHO_MS;
            const now = el.getBoundingClientRect().top;
            window.scrollBy(0, before !== undefined ? now - before : now - toolbarHeight() - 8);
        }
    }
    applyProblems();
}

window.addEventListener('scroll', (() => {
    let pending = false;
    return () => {
        if (pending) {
            return;
        }
        pending = true;
        setTimeout(() => {
            pending = false;
            if (Date.now() < suppressScrollUntil) {
                return;
            }
            const id = topVisibleId();
            if (id && id !== lastReportedTop) {
                lastReportedTop = id;
                post({ type: 'scroll', version, id });
            }
        }, 100);
    };
})(), { passive: true });

content.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const el = target.closest<HTMLElement>('[data-struct-id]');
    if (!el || !content.contains(el)) {
        return;
    }
    if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const link = target.closest<HTMLElement>('a.xref, a.link');
        const resolved = target.closest<HTMLElement>('[data-resolved]');
        let kind: OpenKind = 'source';
        let owner = el;
        if (link) {
            kind = 'link';
            owner = link.closest<HTMLElement>('[data-struct-id]') ?? el;
        } else if (resolved?.dataset.structId) {
            kind = resolved.dataset.resolved === 'conref' ? 'reuse' : 'key';
            owner = resolved;
        }
        post({ type: 'open', version, kind, id: owner.dataset.structId });
        return;
    }
    selectElement(el, true);
});

// ---------------------------------------------------------------------------------------------
// Messages from the host

function applySettings(next: PreviewSettings): void {
    settings = next;
    document.body.dataset.theme = settings.theme;
    document.body.classList.toggle('dc-fluid', settings.pageWidth === 0);
    if (settings.pageWidth > 0) {
        document.documentElement.style.setProperty('--dc-page-width', `${settings.pageWidth}px`);
    }
    renderToolbar();
    renderStatus();
    vscode.setState({ uri: meta?.uri, locked: settings.locked });
}

window.addEventListener('message', (event: MessageEvent<HostToWebview>) => {
    const message = event.data;
    switch (message.type) {
        case 'settings':
            applySettings(message.settings);
            break;
        case 'body':
            version = message.version;
            meta = message.meta;
            setBody(message.html, message.anchor);
            renderStatus();
            vscode.setState({ uri: meta.uri, locked: settings.locked });
            post({ type: 'rendered', version, elements: content.querySelectorAll('[data-struct-id]').length });
            break;
        case 'patch': {
            if (message.version !== version) {
                break;
            }
            // The selection may be the patched element or inside it: find it again by id.
            const selectedId = selected?.dataset.structId;
            for (const item of message.items) {
                const old = byId(item.id);
                if (!old) {
                    continue;
                }
                const template = document.createElement('template');
                template.innerHTML = item.html;
                enhanceImages(template.content);
                old.replaceWith(template.content);
            }
            if (selected && !content.contains(selected)) {
                selected = selectedId ? byId(selectedId) ?? undefined : undefined;
                selected?.classList.add('dc-selected');
                renderStatus();
            }
            applyProblems();
            break;
        }
        case 'problems':
            problems = message.items;
            problemCursor = -1;
            applyProblems();
            renderStatus();
            break;
        case 'reveal': {
            if (!settings.syncEnabled) {
                break;
            }
            const el = firstPresent(message.ids);
            if (!el) {
                break;
            }
            suppressScrollUntil = Date.now() + ECHO_MS;
            if (message.mode === 'top') {
                window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - toolbarHeight() - 8 });
            } else {
                el.scrollIntoView({ block: message.mode === 'center' ? 'center' : 'nearest' });
            }
            if (message.highlight) {
                flash(el);
                selectElement(el, false);
            }
            break;
        }
        case 'banner':
            showBanner(message.kind, message.text, message.line);
            break;
        case 'empty':
            meta = undefined;
            problems = [];
            content.classList.add('dc-empty');
            content.replaceChildren(Object.assign(document.createElement('p'), { className: 'dc-empty-message', textContent: message.text }));
            renderStatus();
            break;
    }
});

renderToolbar();
post({ type: 'ready' });
