/**
 * Menus of the visual editor page: the right-click menu and the toolbar menus (spec §13.3).
 *
 * Renders a MenuItem tree (src/shared/editor/contextMenu.ts) as a cascading menu: submenus
 * open on hover, click or →; ↑/↓, Home/End move; ← and Escape close a level; Enter or Space
 * runs an item; typing a name jumps to it. Items act on mousedown-free clicks so the editor
 * keeps its selection. One menu is open at a time.
 */

import type { MenuItem } from '../../src/shared/editor/contextMenu';

type Runnable = Extract<MenuItem, { kind: 'item' }>;

export interface MenuOptions {
    /** Where to open: a point (right-click), under an element (toolbar button), or above one (status line). */
    at: { x: number; y: number } | { below: DOMRect } | { above: DOMRect };
    /** Focus the first item (opened from the keyboard). */
    focusFirst: boolean;
    /** The button that opened it: a click on it toggles the menu rather than closing and reopening it. */
    anchor?: HTMLElement;
    run(item: Runnable): void;
    onClose?(): void;
}

interface Level {
    element: HTMLElement;
    /** The item of the parent level this level opened from. */
    owner?: HTMLButtonElement;
}

let current: ContextMenu | undefined;

/** The open menu, if any. */
export function openMenu(): ContextMenu | undefined {
    return current;
}

export function closeMenu(): void {
    current?.close();
}

export function showMenu(items: MenuItem[], options: MenuOptions): ContextMenu {
    current?.close();
    current = new ContextMenu(items, options);
    return current;
}

export class ContextMenu {
    private readonly levels: Level[] = [];
    private typed = '';
    private typedAt = 0;
    private hoverTimer: ReturnType<typeof setTimeout> | undefined;
    private closed = false;
    private readonly onOutside = (e: Event): void => {
        const target = e.target as Node;
        if (!this.levels.some((l) => l.element.contains(target)) && !this.options.anchor?.contains(target)) {
            this.close();
        }
    };
    private readonly onBlur = (): void => this.close();

    constructor(items: MenuItem[], private readonly options: MenuOptions) {
        const root = this.render(items, 0);
        document.body.append(root);
        const at = options.at;
        if ('x' in at) {
            this.place(root, at.x, at.y, at.x);
        } else if ('below' in at) {
            this.place(root, at.below.left, at.below.bottom + 2, at.below.left);
        } else {
            this.place(root, at.above.left, Math.max(4, at.above.top - root.getBoundingClientRect().height - 2), at.above.left);
        }
        this.levels.push({ element: root });
        if (options.focusFirst) {
            this.focusItem(root, 0);
        } else {
            root.focus();
        }
        document.addEventListener('mousedown', this.onOutside, true);
        window.addEventListener('blur', this.onBlur);
        window.addEventListener('resize', this.onBlur);
    }

    get isOpen(): boolean {
        return !this.closed;
    }

    get anchor(): HTMLElement | undefined {
        return this.options.anchor;
    }

    /** The root menu element (tests, harnesses). */
    get element(): HTMLElement {
        return this.levels[0].element;
    }

    close(): void {
        if (this.closed) {
            return;
        }
        this.closed = true;
        clearTimeout(this.hoverTimer);
        for (const level of this.levels.splice(0)) {
            level.element.remove();
        }
        document.removeEventListener('mousedown', this.onOutside, true);
        window.removeEventListener('blur', this.onBlur);
        window.removeEventListener('resize', this.onBlur);
        if (current === this) {
            current = undefined;
        }
        this.options.onClose?.();
    }

    // -- rendering --------------------------------------------------------------------------

    private render(items: MenuItem[], depth: number): HTMLElement {
        const menu = document.createElement('div');
        menu.className = 'dc-menu';
        menu.setAttribute('role', 'menu');
        menu.tabIndex = -1;
        menu.dataset.depth = String(depth);
        // Separators only between groups of items.
        const visible = items.filter((item, k) => item.kind !== 'separator'
            || (k > 0 && k < items.length - 1 && items[k - 1].kind !== 'separator'));
        for (const item of visible) {
            menu.append(this.renderItem(item, depth));
        }
        menu.addEventListener('keydown', (e) => this.onKey(e, depth));
        return menu;
    }

    private renderItem(item: MenuItem, depth: number): HTMLElement {
        if (item.kind === 'separator') {
            return Object.assign(document.createElement('div'), { className: 'dc-menu-separator', role: 'separator' });
        }
        if (item.kind === 'heading') {
            return Object.assign(document.createElement('div'), { className: 'dc-menu-heading', textContent: item.label });
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'dc-menu-item';
        button.setAttribute('role', 'menuitem');
        button.dataset.id = item.id;
        button.append(Object.assign(document.createElement('span'), { className: 'dc-menu-label', textContent: item.label }));
        button.addEventListener('mousedown', (e) => e.preventDefault()); // keep the editor's selection
        if (item.kind === 'submenu') {
            button.setAttribute('aria-haspopup', 'menu');
            button.setAttribute('aria-expanded', 'false');
            button.classList.add('dc-menu-sub');
            button.append(Object.assign(document.createElement('span'), { className: 'dc-menu-detail', textContent: '▸' }));
            button.disabled = item.items.length === 0;
            button.addEventListener('click', () => this.openSub(button, item.items, depth + 1, true));
            button.addEventListener('mouseenter', () => {
                button.focus({ preventScroll: true });
                clearTimeout(this.hoverTimer);
                this.hoverTimer = setTimeout(() => this.openSub(button, item.items, depth + 1, false), 120);
            });
            return button;
        }
        if (item.detail) {
            button.append(Object.assign(document.createElement('span'), { className: 'dc-menu-detail', textContent: item.detail }));
        }
        button.disabled = !item.enabled;
        button.addEventListener('click', () => this.activate(item));
        button.addEventListener('mouseenter', () => {
            clearTimeout(this.hoverTimer);
            this.closeFrom(depth + 1);
            if (!button.disabled) {
                button.focus({ preventScroll: true });
            }
        });
        return button;
    }

    private activate(item: Runnable): void {
        if (!item.enabled) {
            return;
        }
        this.close();
        this.options.run(item);
    }

    /** Fixed position at (x, y), kept inside the window; `altX` is where to go when it does not fit to the right. */
    private place(menu: HTMLElement, x: number, y: number, altX: number): void {
        menu.style.left = '0px';
        menu.style.top = '0px';
        const { width, height } = menu.getBoundingClientRect();
        const left = x + width <= window.innerWidth - 4 ? x : Math.max(4, altX - width);
        const top = y + height <= window.innerHeight - 4 ? y : Math.max(4, window.innerHeight - height - 4);
        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
    }

    // -- submenus ------------------------------------------------------------------------------

    private openSub(owner: HTMLButtonElement, items: MenuItem[], depth: number, focusFirst: boolean): void {
        if (this.closed || owner.disabled) {
            return;
        }
        if (this.levels[depth]?.owner === owner) {
            if (focusFirst) {
                this.focusItem(this.levels[depth].element, 0);
            }
            return;
        }
        this.closeFrom(depth);
        const menu = this.render(items, depth);
        menu.classList.add('dc-submenu');
        document.body.append(menu);
        const rect = owner.getBoundingClientRect();
        this.place(menu, rect.right - 2, rect.top - 4, rect.left + 2);
        owner.setAttribute('aria-expanded', 'true');
        this.levels[depth] = { element: menu, owner };
        if (focusFirst) {
            this.focusItem(menu, 0);
        }
    }

    private closeFrom(depth: number): void {
        while (this.levels.length > Math.max(1, depth)) {
            const level = this.levels.pop()!;
            level.owner?.setAttribute('aria-expanded', 'false');
            level.element.remove();
        }
    }

    // -- keyboard --------------------------------------------------------------------------------

    private itemsOf(menu: HTMLElement): HTMLButtonElement[] {
        return [...menu.querySelectorAll<HTMLButtonElement>(':scope > .dc-menu-item')].filter((b) => !b.disabled);
    }

    private focusItem(menu: HTMLElement, index: number): void {
        const items = this.itemsOf(menu);
        if (items.length > 0) {
            items[(index + items.length) % items.length].focus();
        } else {
            menu.focus();
        }
    }

    private onKey(e: KeyboardEvent, depth: number): void {
        const menu = this.levels[depth]?.element;
        if (!menu) {
            return;
        }
        const items = this.itemsOf(menu);
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        let handled = true;
        switch (e.key) {
            case 'ArrowDown':
                this.focusItem(menu, index + 1);
                break;
            case 'ArrowUp':
                this.focusItem(menu, index === -1 ? -1 : index - 1);
                break;
            case 'Home':
                this.focusItem(menu, 0);
                break;
            case 'End':
                this.focusItem(menu, -1);
                break;
            case 'ArrowRight':
            case 'Enter':
            case ' ': {
                const button = items[index];
                if (button?.classList.contains('dc-menu-sub')) {
                    button.click(); // opens the submenu, focused
                } else if (button && e.key !== 'ArrowRight') {
                    button.click();
                }
                break;
            }
            case 'ArrowLeft':
                if (depth > 0) {
                    const owner = this.levels[depth].owner;
                    this.closeFrom(depth);
                    owner?.focus();
                }
                break;
            case 'Escape':
                if (depth > 0) {
                    const owner = this.levels[depth].owner;
                    this.closeFrom(depth);
                    owner?.focus();
                } else {
                    this.close();
                }
                break;
            case 'Tab':
                this.close();
                break;
            default:
                handled = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && this.typeAhead(items, index, e.key);
        }
        if (handled) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    /** Typing jumps to the next item whose label starts with what was typed. */
    private typeAhead(items: HTMLButtonElement[], index: number, key: string): boolean {
        const now = Date.now();
        this.typed = now - this.typedAt < 700 ? this.typed + key.toLowerCase() : key.toLowerCase();
        this.typedAt = now;
        const label = (b: HTMLButtonElement) => (b.querySelector('.dc-menu-label')?.textContent ?? '').toLowerCase();
        const start = this.typed.length > 1 ? Math.max(0, index) : index + 1;
        for (let k = 0; k < items.length; k++) {
            const button = items[(start + k) % items.length];
            if (label(button).startsWith(this.typed)) {
                button.focus();
                return true;
            }
        }
        return true;
    }
}
