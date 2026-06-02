import * as path from 'path';
import * as fs from 'fs';

import type { McpContext } from '../server';
import { resolvePath } from '../workspace';
import { parseReference, findElementByIdOffset } from '../../../server/src/utils/referenceParser';
import { offsetToPosition, uriToPath } from '../../../server/src/utils/textUtils';
import { log } from '../logger';

interface DitaResolveReferenceArgs {
    fromUri?: string;
    reference: string;
    referenceType: 'href' | 'keyref' | 'conref' | 'conkeyref';
}

interface ResolveReferenceResult {
    resolved: boolean;
    targetUri?: string;
    targetFragment?: string;
    targetTitle?: string;
    targetType?: string;
    resolutionTrace: string[];
    error?: string;
}

export async function handleDitaResolveReference(
    args: unknown,
    ctx: McpContext,
): Promise<ResolveReferenceResult> {
    const { fromUri, reference, referenceType } = args as DitaResolveReferenceArgs;
    const trace: string[] = [];

    try {
        switch (referenceType) {
            case 'keyref':
                return resolveKeyref(reference, fromUri, ctx, trace);
            case 'conkeyref':
                return resolveConkeyref(reference, fromUri, ctx, trace);
            case 'href':
            case 'conref':
                return resolveHrefOrConref(reference, fromUri, ctx, trace);
        }
    } catch (err) {
        return {
            resolved: false,
            resolutionTrace: trace,
            error: String(err),
        };
    }
}

async function resolveKeyref(
    keyName: string,
    fromUri: string | undefined,
    ctx: McpContext,
    trace: string[],
): Promise<ResolveReferenceResult> {
    const contextPath = fromUri
        ? (resolvePath(fromUri, ctx.workspaceRoot) ?? '').replace(/^file:\/\/\/?/, '')
        : ctx.workspaceRoot;

    trace.push(`keyref lookup: "${keyName}" from context "${contextPath}"`);

    const keyDef = await ctx.keySpaceService.resolveKey(keyName, contextPath);

    if (!keyDef) {
        trace.push(`  -> not found in key space`);
        return { resolved: false, resolutionTrace: trace, error: `Key "${keyName}" not defined` };
    }

    trace.push(`  -> found key "${keyName}"`);

    if (keyDef.keyref) {
        trace.push(`  -> keyref chain: "${keyName}" -> "${keyDef.keyref}"`);
        return resolveKeyref(keyDef.keyref, fromUri, ctx, trace);
    }

    if (keyDef.targetFile) {
        const targetUri = `file://${keyDef.targetFile.replace(/\\/g, '/')}`;
        const targetTitle = keyDef.metadata?.navtitle ?? extractTitle(keyDef.targetFile);
        const targetType = detectTopicType(keyDef.targetFile);

        trace.push(`  -> resolved to: ${targetUri}${keyDef.elementId ? '#' + keyDef.elementId : ''}`);

        return {
            resolved: true,
            targetUri,
            targetFragment: keyDef.elementId,
            targetTitle,
            targetType,
            resolutionTrace: trace,
        };
    }

    if (keyDef.sourceMap) {
        trace.push(`  -> inline key, defined in: ${keyDef.sourceMap}`);
        return {
            resolved: true,
            targetUri: `file://${keyDef.sourceMap.replace(/\\/g, '/')}`,
            targetTitle: keyDef.metadata?.navtitle,
            resolutionTrace: trace,
        };
    }

    return { resolved: false, resolutionTrace: trace, error: `Key "${keyName}" has no target` };
}

async function resolveConkeyref(
    value: string,
    fromUri: string | undefined,
    ctx: McpContext,
    trace: string[],
): Promise<ResolveReferenceResult> {
    const slashIdx = value.indexOf('/');
    const keyName = slashIdx >= 0 ? value.slice(0, slashIdx) : value;
    const elementId = slashIdx >= 0 ? value.slice(slashIdx + 1) : '';

    trace.push(`conkeyref lookup: key="${keyName}" element="${elementId}"`);

    const keyResult = await resolveKeyref(keyName, fromUri, ctx, trace);

    if (!keyResult.resolved || !keyResult.targetUri) {
        return keyResult;
    }

    if (elementId && keyResult.targetUri) {
        const fsPath = keyResult.targetUri.replace(/^file:\/\/\/?/, '');
        if (fs.existsSync(fsPath)) {
            const content = fs.readFileSync(fsPath, 'utf-8');
            const offset = findElementByIdOffset(content, elementId);
            if (offset >= 0) {
                trace.push(`  -> found element "${elementId}" at offset ${offset}`);
                return {
                    ...keyResult,
                    targetFragment: elementId,
                    resolutionTrace: trace,
                };
            }
        }
        trace.push(`  -> element "${elementId}" not found in target file`);
    }

    return {
        ...keyResult,
        targetFragment: elementId || keyResult.targetFragment,
        resolutionTrace: trace,
    };
}

function resolveHrefOrConref(
    value: string,
    fromUri: string | undefined,
    ctx: McpContext,
    trace: string[],
): ResolveReferenceResult {
    trace.push(`resolving "${value}" as file reference`);

    const parsed = parseReference(value);
    const targetId = parsed.fragment ? parsed.fragment.replace(/^#/, '') : '';

    if (!parsed.filePath) {
        // Same-file reference
        trace.push(`  -> same-file reference to element "${targetId}"`);
        return {
            resolved: true,
            targetUri: fromUri,
            targetFragment: targetId,
            resolutionTrace: trace,
        };
    }

    // Cross-file reference
    const baseDir = fromUri
        ? path.dirname((resolvePath(fromUri, ctx.workspaceRoot) ?? '').replace(/^file:\/\/\/?/, ''))
        : ctx.workspaceRoot;

    const targetPath = path.resolve(baseDir, parsed.filePath);

    if (!fs.existsSync(targetPath)) {
        trace.push(`  -> file not found: ${targetPath}`);
        return {
            resolved: false,
            resolutionTrace: trace,
            error: `Target file not found: ${parsed.filePath}`,
        };
    }

    const targetUri = `file://${targetPath.replace(/\\/g, '/')}`;
    const targetTitle = extractTitle(targetPath);
    const targetType = detectTopicType(targetPath);

    trace.push(`  -> resolved to: ${targetUri}${targetId ? '#' + targetId : ''}`);

    return {
        resolved: true,
        targetUri,
        targetFragment: targetId || undefined,
        targetTitle,
        targetType,
        resolutionTrace: trace,
    };
}

function extractTitle(filePath: string): string | undefined {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const match = content.match(/<title[^>]*>([^<]*)<\/title>/i);
        return match ? match[1].trim() : undefined;
    } catch {
        return undefined;
    }
}

function detectTopicType(filePath: string): string {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.includes('<concept')) return 'concept';
        if (content.includes('<task')) return 'task';
        if (content.includes('<reference')) return 'reference';
        if (content.includes('<glossentry')) return 'glossentry';
        if (content.includes('<topic')) return 'topic';
        if (content.includes('<map') || content.includes('<bookmap')) return 'map';
        return 'unknown';
    } catch {
        return 'unknown';
    }
}
