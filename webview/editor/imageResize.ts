/**
 * Resizing an image by dragging on the visual editor's page.
 *
 * A selected image (click it) shows a handle on its bottom-right corner. Dragging it shows the
 * new size (an outline and "W × H px"), keeping the image's proportions; releasing writes it
 * (src/shared/editor/images.ts resizedImageSize: `@width`/`@height` in their units) as one
 * change — undone with Ctrl+Z on the page. Escape cancels.
 *
 * The handle and the outline are outside the editor's own DOM, so the page's document is only
 * changed by the final transaction.
 */

import { Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { resizedImageSize, type ImageCommands } from '../../src/shared/editor/images';

const MIN_SIZE = 16;

export interface ImageResizeContext {
    images: ImageCommands;
    editable(): boolean;
}

/** The selected image's `<img>` on the page, its position and its node. */
function selectedImg(view: EditorView, images: ImageCommands): { pos: number; img: HTMLImageElement; xml: [string, string][] } | undefined {
    const selected = images.selectedImage(view.state);
    if (!selected) {
        return undefined;
    }
    const dom = view.nodeDOM(selected.pos);
    const img = dom instanceof HTMLImageElement ? dom : dom instanceof HTMLElement ? dom.querySelector('img') : null;
    return img ? { pos: selected.pos, img, xml: selected.node.attrs.xml as [string, string][] } : undefined;
}

export function imageResizing(ctx: () => ImageResizeContext | undefined): Plugin {
    return new Plugin({
        view(view) {
            const handle = Object.assign(document.createElement('div'), { className: 'dc-img-handle', hidden: true });
            handle.setAttribute('aria-hidden', 'true');
            document.body.append(handle);
            let dragging = false;

            const place = (): void => {
                const c = ctx();
                const target = c && c.editable() && !dragging ? selectedImg(view, c.images) : undefined;
                if (!target) {
                    handle.hidden = true;
                    return;
                }
                const rect = target.img.getBoundingClientRect();
                handle.style.left = `${rect.right - 5}px`;
                handle.style.top = `${rect.bottom - 5}px`;
                handle.hidden = rect.width === 0;
            };

            const drag = (start: MouseEvent): void => {
                const c = ctx();
                const target = c ? selectedImg(view, c.images) : undefined;
                if (!c || !target) {
                    return;
                }
                dragging = true;
                handle.hidden = true;
                const rect = target.img.getBoundingClientRect();
                const ratio = rect.height / rect.width;
                const max = Math.max(MIN_SIZE, view.dom.clientWidth);
                // An image on its own line grows from where it is aligned: a centred one on both sides
                // (its corner follows the mouse), a right-aligned one to the left.
                const wrapper = target.img.closest('.image-break');
                const align = wrapper?.classList.contains('imagecenter') ? 'center' : wrapper?.classList.contains('imageright') ? 'right' : 'left';
                const outline = Object.assign(document.createElement('div'), { className: 'dc-img-outline' });
                const label = Object.assign(document.createElement('div'), { className: 'dc-col-guide-label' });
                outline.style.top = `${rect.top}px`;
                document.body.append(outline, label);
                let width = rect.width;
                const show = (clientX: number): void => {
                    const dx = clientX - start.clientX;
                    width = Math.round(Math.min(Math.max(rect.width + (align === 'center' ? 2 * dx : dx), MIN_SIZE), max));
                    const left = align === 'center' ? rect.left + (rect.width - width) / 2 : align === 'right' ? rect.right - width : rect.left;
                    outline.style.left = `${left}px`;
                    outline.style.width = `${width}px`;
                    outline.style.height = `${Math.round(width * ratio)}px`;
                    label.textContent = `${width} × ${Math.round(width * ratio)} px`;
                    label.style.left = `${left + width + 8}px`;
                    label.style.top = `${rect.top + Math.round(width * ratio) - 18}px`;
                };
                show(start.clientX);
                const end = (commit: boolean): void => {
                    window.removeEventListener('mousemove', move, true);
                    window.removeEventListener('mouseup', up, true);
                    window.removeEventListener('keydown', key, true);
                    outline.remove();
                    label.remove();
                    dragging = false;
                    const now = ctx();
                    // Applied to the image it was started on, if it is still the selected one.
                    if (commit && now && Math.abs(width - rect.width) >= 1 && now.images.selectedImage(view.state)?.pos === target.pos) {
                        const attr = (name: string) => target.xml.find(([n]) => n === name)?.[1];
                        const size = resizedImageSize({ width: attr('width'), height: attr('height'), scale: attr('scale') }, rect, width);
                        now.images.setSize(size)(view.state, view.dispatch);
                    }
                    place();
                };
                const move = (e: MouseEvent): void => {
                    e.preventDefault();
                    show(e.clientX);
                };
                const up = (e: MouseEvent): void => {
                    e.preventDefault();
                    show(e.clientX);
                    end(true);
                };
                const key = (e: KeyboardEvent): void => {
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        e.stopPropagation();
                        end(false);
                    }
                };
                window.addEventListener('mousemove', move, true);
                window.addEventListener('mouseup', up, true);
                window.addEventListener('keydown', key, true);
            };

            handle.addEventListener('mousedown', (e) => {
                if (e.button === 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    drag(e);
                }
            });
            const onScroll = (): void => place();
            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', onScroll);
            // An image finishing loading changes its size.
            view.dom.addEventListener('load', onScroll, true);
            place();
            return {
                update: place,
                destroy: () => {
                    window.removeEventListener('scroll', onScroll);
                    window.removeEventListener('resize', onScroll);
                    view.dom.removeEventListener('load', onScroll, true);
                    handle.remove();
                },
            };
        },
    });
}
