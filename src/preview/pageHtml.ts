/*
 * Portions derived from DITA Editor (https://github.com/sageata/dita-editor), file
 * src/webview/canvas-html.ts (CSP and stylesheet layering of a pure page builder).
 * Copyright 2026 Paul Razvan Sarbu. Licensed under the Apache License, Version 2.0;
 * see LICENSE-THIRD-PARTY/apache-2.0.txt.
 * Modified by DitaCraft (2026): preview page shell (toolbar, banner, page, status line);
 * no remote images or fonts; user CSS linked after the built-in stylesheet.
 */

/**
 * The visual preview's static webview document (spec §8). Content arrives later as
 * messages; this shell only changes when its resources change (custom CSS, trust).
 *
 * Environment-neutral: the host passes webview URIs, cspSource and a nonce.
 */

export interface PageHtmlOptions {
    cspSource: string;
    nonce: string;
    scriptUri: string;
    styleUri: string;
    /** User stylesheet (ditacraft.previewCustomCss), only in trusted workspaces. */
    customCssUri?: string;
    lang: string;
    /** Document title and toolbar label (the visual editor reuses this shell). */
    title?: string;
    toolbarLabel?: string;
    /** Base URL for relative references in the content (the topic's folder). */
    baseHref?: string;
}

function esc(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

export function buildPageHtml(o: PageHtmlOptions): string {
    const csp = [
        `default-src 'none'`,
        `img-src ${o.cspSource} data:`,
        `style-src ${o.cspSource} 'unsafe-inline'`,
        `font-src ${o.cspSource}`,
        `script-src 'nonce-${o.nonce}'`,
    ].join('; ');
    const custom = o.customCssUri ? `\n    <link rel="stylesheet" href="${esc(o.customCssUri)}" data-dc-origin="custom">` : '';
    const base = o.baseHref ? `\n    <base href="${esc(o.baseHref)}">` : '';
    return `<!DOCTYPE html>
<html lang="${esc(o.lang)}">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${esc(csp)}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">${base}
    <link rel="stylesheet" href="${esc(o.styleUri)}">${custom}
    <title>${esc(o.title ?? 'DITA Preview')}</title>
</head>
<body data-theme="auto">
    <header id="dc-toolbar" role="toolbar" aria-label="${esc(o.toolbarLabel ?? 'Preview')}"></header>
    <div id="dc-banner" role="status" hidden></div>
    <div id="dc-desk">
        <main id="dc-page" tabindex="-1"><div id="dc-content" class="dc-content"></div></main>
    </div>
    <footer id="dc-status" role="status" aria-live="polite"></footer>
    <script nonce="${esc(o.nonce)}" src="${esc(o.scriptUri)}"></script>
</body>
</html>`;
}
