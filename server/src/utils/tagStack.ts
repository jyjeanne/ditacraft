/**
 * Resync a name-keyed element stack against a closing tag.
 *
 * A closing tag is meant to pop the stack entry it matches. But when an
 * earlier closing tag was mismatched or missing, entries above the intended
 * match were never popped. Removing only the matched entry in that case
 * leaves those stale ancestors on the stack, desyncing every subsequent
 * lookup for the rest of the document (wrong parent/container, corrupted
 * nesting, wrong fold ranges, etc.). Truncating the stack through and
 * including the match discards them too.
 *
 * Searches from the top of the stack down. If a match is found, `onDiscard`
 * (if given) is invoked once per discarded entry, from the top down through
 * the match, before the stack is truncated — `isMatch` is `true` only for
 * the matched entry itself. If no match is found, the stack is left
 * untouched (a stray closing tag with no open ancestor).
 *
 * Returns the matched index, or -1 if nothing matched.
 */
export function resyncStackToMatch<T>(
    stack: T[],
    name: string,
    getName: (item: T) => string,
    onDiscard?: (item: T, index: number, isMatch: boolean) => void
): number {
    for (let i = stack.length - 1; i >= 0; i--) {
        if (getName(stack[i]) === name) {
            if (onDiscard) {
                for (let k = stack.length - 1; k >= i; k--) {
                    onDiscard(stack[k], k, k === i);
                }
            }
            stack.length = i;
            return i;
        }
    }
    return -1;
}
