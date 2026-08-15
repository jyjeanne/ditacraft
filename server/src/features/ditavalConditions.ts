/**
 * DITAVAL Condition Editor Support (§5.3)
 * Backs the `dita/getSubjectSchemeAttributes` request: given a context file
 * (the `.ditaval` file being edited, or any file in the same map tree),
 * resolves the subject scheme(s) that govern that context and returns
 * every controlled attribute/value pair so the client's Visual DITAVAL
 * Condition Editor webview can list them as toggleable include/exclude/flag
 * chips (`src/providers/ditavalConditionEditorPanel.ts`).
 *
 * Resolves the scheme per-context-file via `keySpaceService`, the same
 * approach `batchMetadata.ts` uses (and for the same reason): the shared
 * `SubjectSchemeService` instance's already-registered state reflects
 * whatever document was last opened/validated, not necessarily the file
 * this request is being made for.
 */

import { SubjectSchemeData, SubjectSchemeService } from '../services/subjectSchemeService';
import { KeySpaceService } from '../services/keySpaceService';
import { uriToPath } from '../utils/textUtils';

export interface GetSubjectSchemeAttributesParams {
    contextUri: string;
}

export interface SchemeAttributeValue {
    value: string;
    /** e.g. "Platform > Linux > Ubuntu", when the scheme defines one. */
    hierarchyPath?: string;
}

export interface SchemeAttributeInfo {
    attribute: string;
    values: SchemeAttributeValue[];
}

export interface GetSubjectSchemeAttributesResult {
    attributes: SchemeAttributeInfo[];
}

/**
 * Merge every element-scoped value bucket for an attribute into one
 * deduplicated, sorted list. A DITAVAL `<prop>` rule is attribute/value
 * driven only — it never targets a specific element — so the element
 * scoping `SubjectSchemeData` otherwise carries (needed to validate a
 * particular root element, e.g. `batchMetadata.ts`'s use) doesn't apply
 * to this enumeration.
 *
 * Known pre-existing limitation, inherited from `SubjectSchemeData`'s
 * shape rather than introduced here: `hierarchyPaths` is a single flat
 * `key -> path` map, not scoped per attribute — if two different
 * attributes each define a same-named subject key (e.g. both `audience`
 * and `otherprops` happen to use "internal"), `mergeSchemes()`'s
 * first-definition-wins merge means both attributes' enumerated values
 * show whichever hierarchy path was parsed first, which can be the wrong
 * one for the other attribute. This condition editor is the first caller
 * to display multiple attributes' values side by side in one UI, so it's
 * the first place this can actually mislead a user (existing consumers —
 * hover/completion/profiling validation — only ever look up one
 * attribute's values at a time). Reworking `hierarchyPaths` to be keyed
 * per attribute would fix it at the source but touches a shared data
 * structure several other features depend on; left as a known, documented
 * gap rather than expanding this feature's blast radius.
 */
function enumerateAttributes(data: SubjectSchemeData): SchemeAttributeInfo[] {
    const result: SchemeAttributeInfo[] = [];
    for (const [attribute, elements] of data.validValuesMap) {
        const merged = new Set<string>();
        for (const values of elements.values()) {
            for (const value of values) merged.add(value);
        }
        const values: SchemeAttributeValue[] = [...merged].sort().map(value => {
            const hierarchyPath = data.hierarchyPaths.get(value);
            return hierarchyPath ? { value, hierarchyPath } : { value };
        });
        result.push({ attribute, values });
    }
    result.sort((a, b) => a.attribute.localeCompare(b.attribute));
    return result;
}

export async function handleGetSubjectSchemeAttributes(
    params: GetSubjectSchemeAttributesParams,
    subjectSchemeService: SubjectSchemeService,
    keySpaceService: KeySpaceService | undefined
): Promise<GetSubjectSchemeAttributesResult> {
    const filePath = uriToPath(params.contextUri);
    let schemePaths: string[] = [];
    if (keySpaceService) {
        try {
            schemePaths = await keySpaceService.getSubjectSchemePaths(filePath);
        } catch {
            // Best effort: an empty result just means no scheme-derived
            // attributes are offered — the editor still works with
            // manually-typed attribute/value pairs.
        }
    }
    const data = subjectSchemeService.getSchemeData(schemePaths);
    return { attributes: enumerateAttributes(data) };
}
