/**
 * Internationalization (i18n) utility for diagnostic messages.
 * Supports LSP locale from InitializeParams.
 * Uses {0}, {1}, ... placeholders for message interpolation.
 */

import enRaw from '../messages/en.json';
import frRaw from '../messages/fr.json';

type MessageBundle = Record<string, string>;

const en: MessageBundle = enRaw;

/** Statically imported locale bundles. Add new locales here. */
const BUNDLES: Record<string, MessageBundle> = {
    en,
    fr: frRaw,
};

let currentBundle: MessageBundle = en;

/**
 * Set the locale for diagnostic messages.
 * Falls back to English if the locale bundle is not available.
 */
export function setLocale(locale: string | undefined): void {
    if (!locale) return;

    const lang = locale.split(/[-_]/)[0].toLowerCase();
    const bundle = BUNDLES[lang];
    if (bundle) {
        currentBundle = { ...en, ...bundle }; // English fallback for missing keys
    } else {
        currentBundle = en;
    }
}

/**
 * Get a localized message by key, with optional placeholder interpolation.
 * Placeholders: {0}, {1}, {2}, etc.
 *
 * If the key is not found, returns the key itself (passthrough for dynamic messages).
 */
export function t(key: string, ...args: (string | number)[]): string {
    let message = currentBundle[key] ?? en[key] ?? key;
    for (let i = 0; i < args.length; i++) {
        message = message.replace(new RegExp(`\\{${i}\\}`, 'g'), String(args[i]));
    }
    return message;
}
