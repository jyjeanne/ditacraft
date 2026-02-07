import { TextDocument } from 'vscode-languageserver-textdocument';
import { TextDocuments } from 'vscode-languageserver/node';

/** Default URI used in tests */
export const TEST_URI = 'file:///test.dita';

/**
 * Create a real TextDocument from content string.
 */
export function createDoc(
    content: string,
    uri: string = TEST_URI,
    languageId: string = 'xml'
): TextDocument {
    return TextDocument.create(uri, languageId, 1, content);
}

/**
 * Create a TextDocuments-compatible mock that returns the given documents.
 * Only implements `.get(uri)` which is all handlers use.
 */
export function createDocs(
    ...docs: TextDocument[]
): TextDocuments<TextDocument> {
    const map = new Map<string, TextDocument>();
    for (const doc of docs) {
        map.set(doc.uri, doc);
    }
    return { get: (uri: string) => map.get(uri) } as unknown as TextDocuments<TextDocument>;
}

/**
 * Create a TextDocuments mock from a single content string.
 * Convenience wrapper around createDoc + createDocs.
 */
export function createDocsFromContent(
    content: string,
    uri: string = TEST_URI
): { documents: TextDocuments<TextDocument>; document: TextDocument } {
    const document = createDoc(content, uri);
    const documents = createDocs(document);
    return { documents, document };
}
