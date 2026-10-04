/**
 * typesxml adapter: parse a DTD shell (through an OASIS catalog) into a RawGrammar.
 *
 * Node-only (typesxml reads files). Used by the build-time grammar build and by the
 * extension host's runtime compiler for project DTDs; never bundled into a webview.
 *
 * typesxml ships ESM type declarations that a CommonJS build cannot import, so — like
 * server/src/services/catalogValidationService.ts — it is loaded with require() against
 * the minimal structural types below.
 */

import * as path from 'path';
import type { GrammarAttribute, ModelType, Occurs, Particle, RawElement, RawGrammar } from './types';

interface TxParticle {
    getType(): number;
    getCardinality(): number;
    getParticles(): TxParticle[];
    getName?(): string;
}

interface TxContentModel {
    getType(): string;
    getContent(): TxParticle[];
}

interface TxAttDecl {
    getType(): string;
    getEnumeration(): string[];
}

interface TxAttributeInfo {
    name: string;
    datatype: string;
    use: string;
    defaultValue: string;
}

interface TxEntityDecl {
    isParameterEntity(): boolean;
    getValue(): string;
    getSystemId?(): string;
}

interface TxDtdGrammar {
    getElementDeclMap(): Map<string, unknown>;
    getContentModel(name: string): TxContentModel | undefined;
    getElementAttributes(name: string): Map<string, TxAttributeInfo>;
    getElementAttributesMap(name: string): Map<string, TxAttDecl> | undefined;
    getEntitiesMap(): Map<string, TxEntityDecl>;
}

interface TxDtdParser {
    setCatalog(catalog: unknown): void;
    parseDTD(file: string): TxDtdGrammar;
}

interface TypesXmlModule {
    DTDParser: { new (): TxDtdParser; prototype: Record<string, unknown> };
    Catalog: new (catalogPath: string) => unknown;
    ContentParticleType: { PCDATA: number; NAME: number; SEQUENCE: number; CHOICE: number };
    Cardinality: { NONE: number; OPTIONAL: number; ZEROMANY: number; ONEMANY: number };
}

function loadTypesXml(): TypesXmlModule {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('typesxml') as TypesXmlModule;
}

export interface DtdReadResult {
    raw: RawGrammar;
    /** Every file the parse read (shell, modules, entity files), absolute. */
    loadedFiles: string[];
}

/**
 * Parse `shellPath`, resolving PUBLIC identifiers through `catalogPath` when given.
 * Throws when the DTD cannot be parsed.
 */
export function readDtdGrammar(shellPath: string, catalogPath?: string): DtdReadResult {
    const tx = loadTypesXml();
    const loaded = new Set<string>([path.resolve(shellPath)]);

    // Record every file the parser touches, including nested parser instances, by
    // wrapping the two prototype methods all file access goes through. The parse is
    // synchronous, so the wrappers are restored before anything else can run.
    const proto = tx.DTDParser.prototype as Record<string, unknown>;
    const origResolve = proto.resolveEntity as (this: unknown, p: string, s: string) => string;
    const origRead = proto.readFileContent as ((this: unknown, f: string) => string) | undefined;
    proto.resolveEntity = function (this: unknown, publicId: string, systemId: string): string {
        const location = origResolve.call(this, publicId, systemId);
        if (typeof location === 'string' && !/^https?:/i.test(location)) {
            loaded.add(path.resolve(location));
        }
        return location;
    };
    if (origRead) {
        proto.readFileContent = function (this: unknown, file: string): string {
            loaded.add(path.resolve(file));
            return origRead.call(this, file);
        };
    }

    let grammar: TxDtdGrammar;
    try {
        const parser = new tx.DTDParser();
        if (catalogPath) {
            parser.setCatalog(new tx.Catalog(path.resolve(catalogPath))); // typesxml requires absolute
        }
        grammar = parser.parseDTD(path.resolve(shellPath));
    } finally {
        proto.resolveEntity = origResolve;
        if (origRead) {
            proto.readFileContent = origRead;
        }
    }

    return { raw: toRawGrammar(tx, grammar), loadedFiles: [...loaded].sort() };
}

function toRawGrammar(tx: TypesXmlModule, grammar: TxDtdGrammar): RawGrammar {
    const occursOf = (card: number): Occurs => {
        switch (card) {
            case tx.Cardinality.OPTIONAL: return '?';
            case tx.Cardinality.ZEROMANY: return '*';
            case tx.Cardinality.ONEMANY: return '+';
            default: return '';
        }
    };
    const convert = (p: TxParticle): Particle => {
        const type = p.getType();
        if (type === tx.ContentParticleType.PCDATA) {
            return { kind: 'pcdata' };
        }
        if (type === tx.ContentParticleType.NAME) {
            return { kind: 'name', name: p.getName!(), occurs: occursOf(p.getCardinality()) };
        }
        return {
            kind: type === tx.ContentParticleType.SEQUENCE ? 'seq' : 'choice',
            items: p.getParticles().map(convert),
            occurs: occursOf(p.getCardinality()),
        };
    };

    const elements = new Map<string, RawElement>();
    for (const name of grammar.getElementDeclMap().keys()) {
        const cm = grammar.getContentModel(name);
        const modelType = (cm?.getType() ?? 'ANY') as ModelType;
        const content = cm?.getContent() ?? [];
        let model: Particle | undefined;
        if (content.length === 1) {
            model = convert(content[0]);
        } else if (content.length > 1) {
            model = { kind: 'seq', items: content.map(convert), occurs: '' };
        }
        elements.set(name, { name, modelType, model, attrs: readAttributes(grammar, name) });
    }

    const entities = new Map<string, string>();
    for (const [key, decl] of grammar.getEntitiesMap()) {
        if (key.startsWith('%') || decl.isParameterEntity()) {
            continue;
        }
        const value = decl.getValue();
        if (typeof value === 'string') {
            entities.set(key, value);
        }
    }
    return { elements, entities };
}

function readAttributes(grammar: TxDtdGrammar, element: string): Record<string, GrammarAttribute> {
    const out: Record<string, GrammarAttribute> = {};
    const decls = grammar.getElementAttributesMap(element);
    for (const [name, info] of grammar.getElementAttributes(element)) {
        const decl = decls?.get(name);
        const values = decl?.getEnumeration() ?? [];
        const enumerated = values.length > 0 || /^\s*\(/.test(info.datatype);
        const attr: GrammarAttribute = {
            type: enumerated ? 'enum' : info.datatype,
            default: info.defaultValue === '' ? null : info.defaultValue,
            required: info.use === 'required',
        };
        if (enumerated && values.length > 0) {
            attr.values = values;
        }
        if (info.use === 'fixed') {
            attr.fixed = true;
        }
        out[name] = attr;
    }
    return out;
}
