/**
 * DITA Version Detection (Phase 8).
 * Detects the DITA version from document content so that version-specific
 * validation rules can be applied automatically.
 */

import { DitaVersion } from '../features/ditaRulesValidator';

/**
 * Detect DITA version from document content.
 * Checks (in order):
 * 1. ditaarch:DITAArchVersion attribute on root element
 * 2. DOCTYPE public identifier
 * 3. Default to '1.3'
 */
export function detectDitaVersion(text: string): DitaVersion {
    // 1. Check DITAArchVersion attribute
    const versionAttrMatch =
        /DITAArchVersion\s*=\s*["']([^"']+)["']/.exec(text);
    if (versionAttrMatch) {
        const version = versionAttrMatch[1].trim();
        if (version.startsWith('1.0')) return '1.0';
        if (version.startsWith('1.1')) return '1.1';
        if (version.startsWith('1.2')) return '1.2';
        if (version.startsWith('1.3')) return '1.3';
        if (version.startsWith('2.')) return '2.0';
    }

    // 2. Check DOCTYPE public identifier
    const doctypeMatch = /<!DOCTYPE\s+\w+\s+PUBLIC\s+"([^"]+)"/.exec(text);
    if (doctypeMatch) {
        const publicId = doctypeMatch[1];
        if (publicId.includes('1.0')) return '1.0';
        if (publicId.includes('1.1')) return '1.1';
        if (publicId.includes('1.2')) return '1.2';
        if (publicId.includes('1.3')) return '1.3';
        if (publicId.includes('2.0')) return '2.0';
    }

    // 3. Default
    return '1.3';
}
