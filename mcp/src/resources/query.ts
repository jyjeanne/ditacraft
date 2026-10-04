/**
 * Query parameters on the workspace resources (`dita://workspace/diagnostics?severity=error&limit=10`).
 *
 * The MCP SDK finds a resource by its exact URI, so a URI with a query string matched no resource
 * ("Resource … not found"), and its URI templates (`{?a,b}`) match only when every parameter is
 * given, in the template's order. A resource with optional parameters is therefore registered twice:
 * as a resource (listed, read without parameters) and as a template that takes the resource's URI
 * with any query string — each parameter optional, in any order. The read checks the parameters.
 */

import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { UriTemplate, Variables } from '@modelcontextprotocol/sdk/shared/uriTemplate.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

/** Matches `base?…` with any query string. Listed as `base{?name,…}` (RFC 6570). */
class OptionalQueryTemplate extends UriTemplate {
    constructor(private readonly base: string, names: readonly string[]) {
        super(`${base}{?${names.join(',')}}`);
    }

    override match(uri: string): Variables | null {
        const withoutFragment = uri.split('#')[0];
        const q = withoutFragment.indexOf('?');
        if (q < 0 || withoutFragment.slice(0, q) !== this.base) {
            return null;
        }
        const variables: Variables = {};
        new URLSearchParams(withoutFragment.slice(q + 1)).forEach((value, name) => { variables[name] = value; });
        return variables;
    }
}

/** The template that reads `base` with query parameters `names`. */
export function queryTemplate(base: string, names: readonly string[]): ResourceTemplate {
    return new ResourceTemplate(new OptionalQueryTemplate(base, names), { list: undefined });
}

/** An invalid query parameter: the client is told what to send instead. */
export function invalidParameter(message: string): McpError {
    return new McpError(ErrorCode.InvalidParams, message);
}

/** The query parameters of a read of `base`. An unknown one is an error naming the known ones. */
export function queryParameters(uri: URL, base: string, names: readonly string[]): Record<string, string> {
    const params: Record<string, string> = {};
    for (const [name, value] of uri.searchParams) {
        if (!names.includes(name)) {
            throw invalidParameter(`Unknown parameter "${name}" for ${base}: use ${names.join(', ')}.`);
        }
        params[name] = value;
    }
    return params;
}
