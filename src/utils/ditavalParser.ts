/**
 * DITAVAL Rule Parsing (§4.5 Piece 2: condition highlighting)
 *
 * Lightweight regex-based parsing of `.ditaval` filter rules and matching
 * against an element's profiling attributes. Regex-based, matching this
 * codebase's established client-side XML handling convention (see
 * insertImageCommand.ts / fileCreationCommands.ts) rather than a full
 * parser — a `.ditaval` file's own well-formedness is already validated
 * elsewhere (contentModelValidation.ts); this module only needs to *read*
 * its `<prop>` rules, not validate them.
 *
 * Deliberately scoped to exact attribute/value matching only — it does not
 * resolve a subject scheme's controlled-value hierarchy (e.g. knowing that
 * `audience="internal"` is a child of `audience="restricted"` in a
 * `<subjectdef>` tree). That resolution already exists server-side
 * (`SubjectSchemeService`), and wiring a client-side decoration pass
 * through it is real future work, not something to fold into this pass —
 * see `docs/V0.9-IMPLEMENTATION-PLAN.md` §4.5 for the tracked scope note.
 */

/** A single `<prop>` rule parsed out of a `.ditaval` file. */
export interface DitavalRule {
    action: string;
    att?: string;
    val?: string;
}

/**
 * Profiling attributes DITAVAL `<prop>` rules can target. Mirrors the
 * standard DITA profiling attribute set; `otherprops`/`props` are the two
 * legacy/generic ones, the rest are the well-known specific attributes.
 *
 * `/code-review` fix: this list had drifted from the two sibling lists
 * elsewhere in the codebase — `profilingValidation.ts`'s server-side
 * `PROFILING_ATTRIBUTES` and `batchMetadataCommand.ts`'s
 * `KNOWN_PROFILING_ATTRIBUTES` both include `deliveryTarget` (a DITA 1.3+
 * profiling attribute), which this list omitted, so the Visual DITAVAL
 * Condition Editor's dropdown and condition-highlighting decoration pass
 * never offered or dimmed `deliveryTarget`-based conditions. This list is
 * intentionally a *superset* of those two, not an exact copy: `rev`
 * (revision marking) is a real, DITAVAL-filterable attribute those other
 * two lists correctly exclude, since `rev` values are typically free-form
 * and not subject-scheme-controlled — the property those lists actually
 * track (see `profilingValidation.ts`'s own comment: "attributes that can
 * be constrained by subject schemes").
 */
export const PROFILING_ATTRIBUTES = ['audience', 'platform', 'product', 'otherprops', 'props', 'rev', 'deliveryTarget'] as const;

/**
 * The attributes DITA filters content on — the conditional processing
 * attributes (lower case): a `.ditaval` file's filter-wide default rule applies
 * to them. `@rev` is not one (DITA uses it for flagging). Specializations of
 * `@props` other than `deliveryTarget` are named by the document type (its
 * `@domains`); callers that know them pass them to `isExcludedByRules`.
 */
export const FILTERING_ATTRIBUTES = ['audience', 'platform', 'product', 'otherprops', 'props', 'deliverytarget'] as const;

export function isFilteringAttribute(lowerCaseName: string): boolean {
    return (FILTERING_ATTRIBUTES as readonly string[]).includes(lowerCaseName);
}

/**
 * The attributes whose values may hold groups, such as `product="database(dbA dbB) appserver(mySERVER)"`.
 * These are the conditional processing attributes of DITA 1.3 §2.4.3.1, plus `@props`, whose
 * generalized values (`props="jobrole(programmer)"`) use the same syntax.
 */
export const GROUPED_ATTRIBUTES = ['audience', 'platform', 'product', 'otherprops', 'props'] as const;

/** A group of the values of a conditional processing attribute; no `name` for the values outside any group. */
export interface ConditionGroup {
    name?: string;
    tokens: string[];
}

/**
 * The groups of an attribute's value (lower-case name), following DITA 1.3 §2.4.3.1:
 * - A group is "a name immediately followed by a parenthetical group of zero or more space-delimited
 *   string values".
 * - The values outside any group, and those of a group named after the attribute, form its implicit
 *   group (no `name`).
 * - Groups of the same name are merged.
 * - Empty groups are left out: `product="database()"` is no attribute at all.
 * An attribute that cannot hold groups is one group of its values.
 */
export function conditionGroups(lowerCaseName: string, value: string): ConditionGroup[] {
    if (!(GROUPED_ATTRIBUTES as readonly string[]).includes(lowerCaseName)) {
        const tokens = value.split(/\s+/).filter(t => t.length > 0);
        return tokens.length > 0 ? [{ tokens }] : [];
    }
    const groups = new Map<string, ConditionGroup>();
    const add = (name: string | undefined, tokens: string[]): void => {
        const key = name === undefined || name.toLowerCase() === lowerCaseName ? '' : name.toLowerCase();
        let group = groups.get(key);
        if (!group) {
            group = key ? { name, tokens: [] } : { tokens: [] };
            groups.set(key, group);
        }
        group.tokens.push(...tokens);
    };
    for (const m of value.matchAll(/([^\s()]+)\(([^()]*)\)|\S+/g)) {
        if (m[1] !== undefined) {
            add(m[1], m[2].split(/\s+/).filter(t => t.length > 0));
        } else {
            add(undefined, [m[0]]);
        }
    }
    return [...groups.values()].filter(g => g.tokens.length > 0);
}

const PROP_TAG_PATTERN =/<prop\b((?:[^>"']|"[^"]*"|'[^']*')*)\/?>/gi;
const ATTR_PATTERN = /([\w-]+)\s*=\s*"([^"]*)"|([\w-]+)\s*=\s*'([^']*)'/g;

/** Parse every attribute name/value pair out of a tag's raw attribute text. */
function parseAttributes(attrsText: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    ATTR_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = ATTR_PATTERN.exec(attrsText)) !== null) {
        const name = (match[1] ?? match[3]).toLowerCase();
        const value = match[2] ?? match[4];
        attrs[name] = value;
    }
    return attrs;
}

/**
 * Parse every `<prop action="..." att="..." val="...">` rule out of a
 * `.ditaval` file's content. Rules missing `action` are skipped — they
 * can't drive an exclude/include decision.
 */
export function parseDitavalRules(content: string): DitavalRule[] {
    const rules: DitavalRule[] = [];
    PROP_TAG_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = PROP_TAG_PATTERN.exec(content)) !== null) {
        const attrs = parseAttributes(match[1]);
        if (!attrs.action) {
            continue;
        }
        rules.push({
            action: attrs.action.toLowerCase(),
            att: attrs.att?.toLowerCase(),
            val: attrs.val
        });
    }
    return rules;
}

/**
 * Regenerate a complete `.ditaval` document from a flat list of rules —
 * used by the Visual DITAVAL Condition Editor (§5.3) to write back a
 * toggled condition set.
 *
 * This REPLACES the file's entire `<val>` content. Anything the editor
 * doesn't model as a `DitavalRule` — comments, `<style-conflict>` blocks,
 * or any element other than `<prop>` — is not preserved; a value-less
 * "default for this attribute" rule (`att` set, `val` omitted) IS
 * preserved as long as it's included in `rules`, since the editor keeps
 * those alongside the value-specific rules it edits rather than dropping
 * them (see `ditavalConditionEditorPanel.ts`). This is a documented,
 * deliberate v1 scope limit — the editor surfaces a warning about it
 * before the first edit rather than silently discarding content.
 */
export function buildDitavalDocument(rules: readonly DitavalRule[]): string {
    const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<val>'];
    for (const rule of rules) {
        const parts = [`action="${escapeDitavalAttr(rule.action)}"`];
        if (rule.att) {
            parts.push(`att="${escapeDitavalAttr(rule.att)}"`);
        }
        if (rule.val !== undefined) {
            parts.push(`val="${escapeDitavalAttr(rule.val)}"`);
        }
        lines.push(`    <prop ${parts.join(' ')}/>`);
    }
    lines.push('</val>');
    return lines.join('\n') + '\n';
}

function escapeDitavalAttr(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/**
 * True if a filtered publish would exclude an element with these attributes,
 * by DITA's filtering logic (DITA 1.3, "Filtering logic"): each attribute is
 * evaluated on its own — it excludes the element only when **every** one of
 * its values is excluded (profiling attributes are space-separated value
 * lists: `audience="internal external"` stays when only `internal` is
 * excluded) — and the element is excluded when any one attribute excludes
 * it. An attribute without values excludes nothing.
 *
 * A value's action is that of the rule for its attribute and value, else of
 * the attribute's `val`-less default rule (`<prop action="exclude"
 * att="platform"/>`), else of the filter-wide default rule (`<prop
 * action="exclude"/>`, no `att` and no `val`), else include — whatever their
 * order in the file (the standard "exclude by default, selectively include"
 * pattern works at both levels). Only `exclude` removes content:
 * `include`/`flag`/`passthrough` keep it.
 *
 * The filter-wide default applies to the filtering attributes only
 * (`isFiltering`: by default `FILTERING_ATTRIBUTES` — not `@rev`, which DITA
 * uses for flagging, nor `@id`, `@outputclass`… when a caller passes an
 * element's every attribute); a rule naming another attribute still applies to
 * it. Attribute names compare case-insensitively (`parseDitavalRules` lowers a
 * rule's `att`; elements carry `deliveryTarget`).
 *
 * Grouped values (`product="appserver(mySERVER) database(dbA dbB)"`, see
 * `conditionGroups`) follow DITA 1.3 §2.4.3.2: "a group evaluates to "exclude"
 * only when every token in that group evaluates to "exclude"", and "if any group
 * within an attribute evaluates to "exclude", that attribute evaluates to
 * "exclude"". The values outside any group form a group of their own.
 */
export function isExcludedByRules(attrs: Record<string, string | undefined>, rules: readonly DitavalRule[],
    isFiltering: (lowerCaseName: string) => boolean = isFilteringAttribute): boolean {
    for (const [attName, rawValue] of Object.entries(attrs)) {
        if (rawValue === undefined) {
            continue;
        }
        const name = attName.toLowerCase();
        if (conditionGroups(name, rawValue).some(group =>
            group.tokens.every(token => governingRule(name, token, rules, isFiltering, group.name)?.action === 'exclude'))) {
            return true;
        }
    }
    return false;
}

/**
 * The rule that decides what happens to one value of an attribute (lower-case
 * name): the rule for that attribute and value, else the attribute's
 * `val`-less default rule, else — for a filtering attribute — the filter-wide
 * default rule (the first `<prop>` without `att` and `val`); undefined when
 * none does (the value is included, unflagged). Shared by exclusion and the
 * preview's flags, so both read a `.ditaval` file the same way.
 *
 * A value of a group (`group`, its name as written) is decided in the order of
 * DITA 1.3 §2.4.3.2 for "myDB" in the `database()` group of `@product`:
 * `database="myDB"`, `product="myDB"`, `product="database"` ("default for the
 * database group"), `product`, the filter-wide default. A rule on the group name
 * without a value (`<prop att="database" action="exclude"/>`), which the standard
 * does not mention, is read as DITA-OT 4.3.5 reads it: as the group's default,
 * right after `database="myDB"`.
 */
export function governingRule(lowerCaseName: string, token: string, rules: readonly DitavalRule[],
    isFiltering: (lowerCaseName: string) => boolean = isFilteringAttribute, group?: string): DitavalRule | undefined {
    // A named group, not the implicit group of the attribute's own values
    const named = group !== undefined && group.toLowerCase() !== lowerCaseName;
    const groupRules = named ? rules.filter(r => r.att === group.toLowerCase()) : [];
    const attRules = rules.filter(r => r.att === lowerCaseName);
    return groupRules.find(r => r.val === token)
        ?? groupRules.find(r => r.val === undefined)
        ?? attRules.find(r => r.val === token)
        ?? (named ? attRules.find(r => r.val === group) : undefined)
        ?? attRules.find(r => r.val === undefined)
        ?? (isFiltering(lowerCaseName) ? rules.find(r => r.att === undefined && r.val === undefined) : undefined);
}
