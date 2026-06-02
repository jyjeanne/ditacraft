"use strict";
/**
 * Internationalization (i18n) utility for diagnostic messages.
 * Supports LSP locale from InitializeParams.
 * Uses {0}, {1}, ... placeholders for message interpolation.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLocale = setLocale;
exports.t = t;
const en_json_1 = __importDefault(require("../messages/en.json"));
const fr_json_1 = __importDefault(require("../messages/fr.json"));
const en = en_json_1.default;
/** Statically imported locale bundles. Add new locales here. */
const BUNDLES = {
    en,
    fr: fr_json_1.default,
};
let currentBundle = en;
/**
 * Set the locale for diagnostic messages.
 * Falls back to English if the locale bundle is not available.
 */
function setLocale(locale) {
    if (!locale)
        return;
    const lang = locale.split(/[-_]/)[0].toLowerCase();
    const bundle = BUNDLES[lang];
    if (bundle) {
        currentBundle = { ...en, ...bundle }; // English fallback for missing keys
    }
    else {
        currentBundle = en;
    }
}
/**
 * Get a localized message by key, with optional placeholder interpolation.
 * Placeholders: {0}, {1}, {2}, etc.
 *
 * If the key is not found, returns the key itself (passthrough for dynamic messages).
 */
function t(key, ...args) {
    let message = currentBundle[key] ?? en[key] ?? key;
    for (let i = 0; i < args.length; i++) {
        message = message.replace(new RegExp(`\\{${i}\\}`, 'g'), String(args[i]));
    }
    return message;
}
//# sourceMappingURL=i18n.js.map