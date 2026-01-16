/**
 * File Creation Commands
 * Commands for creating new DITA files from templates
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../utils/logger';

// Constants for file name validation
const FILE_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const FILE_NAME_VALIDATION_MESSAGE = 'File name can only contain letters, numbers, hyphens, and underscores';

/**
 * Options for creating a DITA file
 */
interface FileCreationOptions {
    fileName: string;
    extension: string;
    content: string;
    fileType: string;
    additionalInfo?: Record<string, unknown>;
}

/**
 * Validate file name input
 * Exported for testing
 */
export function validateFileName(value: string): string | null {
    if (!value) {
        return 'File name is required';
    }
    if (!FILE_NAME_PATTERN.test(value)) {
        return FILE_NAME_VALIDATION_MESSAGE;
    }
    return null;
}

/**
 * Get the current workspace folder or show error
 */
function getWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        logger.error('No workspace folder open');
        vscode.window.showErrorMessage('No workspace folder open');
    }
    return workspaceFolder;
}

/**
 * Create a DITA file from options
 * This is the core function that handles file creation, reducing code duplication
 */
async function createDitaFile(options: FileCreationOptions): Promise<void> {
    const workspaceFolder = getWorkspaceFolder();
    if (!workspaceFolder) {
        return;
    }

    logger.debug('Workspace folder', { path: workspaceFolder.uri.fsPath });

    // Create file path
    const fullFileName = `${options.fileName}${options.extension}`;
    const filePath = path.join(workspaceFolder.uri.fsPath, fullFileName);

    logger.debug('Creating file', { filePath });

    // Check if file already exists
    if (fs.existsSync(filePath)) {
        logger.warn('File already exists', { filePath });
        vscode.window.showErrorMessage(`File already exists: ${fullFileName}`);
        return;
    }

    // Write file with error handling
    try {
        fs.writeFileSync(filePath, options.content, 'utf8');
    } catch (writeError) {
        const writeErrorMessage = writeError instanceof Error ? writeError.message : 'Unknown write error';
        logger.error('Failed to write file', { filePath, error: writeErrorMessage });
        throw new Error(`Failed to write file: ${writeErrorMessage}`);
    }

    logger.info(`Created DITA ${options.fileType} file`, {
        filePath,
        fileName: fullFileName,
        ...options.additionalInfo
    });

    // Open file in editor
    const document = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(document);

    vscode.window.showInformationMessage(`Created ${options.fileType}: ${fullFileName}`);
}

/**
 * Prompt user for file name with validation
 */
async function promptForFileName(placeholder: string, prompt: string): Promise<string | undefined> {
    return vscode.window.showInputBox({
        prompt,
        placeHolder: placeholder,
        validateInput: validateFileName
    });
}

/**
 * Command: ditacraft.newTopic
 * Creates a new DITA topic file
 */
export async function newTopicCommand(): Promise<void> {
    try {
        logger.debug('Starting newTopicCommand');

        // Ask for topic type
        const topicType = await vscode.window.showQuickPick([
            { label: 'Topic', description: 'Generic DITA topic', value: 'topic' },
            { label: 'Concept', description: 'Conceptual information', value: 'concept' },
            { label: 'Task', description: 'Step-by-step procedure', value: 'task' },
            { label: 'Reference', description: 'Reference information', value: 'reference' }
        ], {
            placeHolder: 'Select topic type',
            title: 'Create New DITA Topic'
        });

        if (!topicType) {
            logger.debug('User cancelled topic type selection');
            return;
        }

        logger.debug('Topic type selected', { type: topicType.value });

        // Ask for file name
        const fileName = await promptForFileName('my-topic', 'Enter file name (without extension)');

        if (!fileName) {
            logger.debug('User cancelled file name input');
            return;
        }

        logger.debug('File name entered', { fileName });

        // Generate and create file
        const content = generateTopicContent(topicType.value, fileName);
        logger.debug('Generated content', { length: content.length, topicType: topicType.value });

        await createDitaFile({
            fileName,
            extension: '.dita',
            content,
            fileType: topicType.label,
            additionalInfo: { topicType: topicType.value }
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to create topic', error);
        vscode.window.showErrorMessage(`Failed to create topic: ${errorMessage}`);
    }
}

/**
 * Command: ditacraft.newMap
 * Creates a new DITA map file
 */
export async function newMapCommand(): Promise<void> {
    try {
        logger.debug('Starting newMapCommand');

        // Ask for file name
        const fileName = await promptForFileName('my-map', 'Enter map file name (without extension)');

        if (!fileName) {
            logger.debug('User cancelled file name input');
            return;
        }

        logger.debug('File name entered', { fileName });

        // Generate and create file
        const content = generateMapContent(fileName);
        logger.debug('Generated map content', { length: content.length });

        await createDitaFile({
            fileName,
            extension: '.ditamap',
            content,
            fileType: 'map'
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to create map', error);
        vscode.window.showErrorMessage(`Failed to create map: ${errorMessage}`);
    }
}

/**
 * Command: ditacraft.newBookmap
 * Creates a new DITA bookmap file
 */
export async function newBookmapCommand(): Promise<void> {
    try {
        logger.debug('Starting newBookmapCommand');

        // Ask for book title
        const bookTitle = await vscode.window.showInputBox({
            prompt: 'Enter book title',
            placeHolder: 'User Guide'
        });

        if (!bookTitle) {
            logger.debug('User cancelled book title input');
            return;
        }

        logger.debug('Book title entered', { bookTitle });

        // Ask for file name
        const fileName = await promptForFileName('user-guide', 'Enter bookmap file name (without extension)');

        if (!fileName) {
            logger.debug('User cancelled file name input');
            return;
        }

        logger.debug('File name entered', { fileName });

        // Generate and create file
        const content = generateBookmapContent(bookTitle, fileName);
        logger.debug('Generated bookmap content', { length: content.length });

        await createDitaFile({
            fileName,
            extension: '.bookmap',
            content,
            fileType: 'bookmap',
            additionalInfo: { bookTitle }
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to create bookmap', error);
        vscode.window.showErrorMessage(`Failed to create bookmap: ${errorMessage}`);
    }
}

/**
 * Generate DITA topic content based on type
 * Exported for testing
 */
export function generateTopicContent(topicType: string, id: string): string {
    switch (topicType) {
        case 'concept':
            return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA Concept//EN" "concept.dtd">
<concept id="${id}">
    <title>Concept Title</title>
    <shortdesc>Brief description of this concept.</shortdesc>
    <conbody>
        <p>Conceptual information goes here.</p>
        <section>
            <title>Section Title</title>
            <p>Additional conceptual information.</p>
        </section>
    </conbody>
</concept>
`;

        case 'task':
            return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE task PUBLIC "-//OASIS//DTD DITA Task//EN" "task.dtd">
<task id="${id}">
    <title>Task Title</title>
    <shortdesc>Brief description of this task.</shortdesc>
    <taskbody>
        <prereq>
            <p>Prerequisites for this task.</p>
        </prereq>
        <context>
            <p>Context and background information.</p>
        </context>
        <steps>
            <step>
                <cmd>First step command.</cmd>
                <info>Additional information about this step.</info>
            </step>
            <step>
                <cmd>Second step command.</cmd>
            </step>
        </steps>
        <result>
            <p>Expected result after completing this task.</p>
        </result>
    </taskbody>
</task>
`;

        case 'reference':
            return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE reference PUBLIC "-//OASIS//DTD DITA Reference//EN" "reference.dtd">
<reference id="${id}">
    <title>Reference Title</title>
    <shortdesc>Brief description of this reference.</shortdesc>
    <refbody>
        <section>
            <title>Section Title</title>
            <p>Reference information goes here.</p>
        </section>
        <properties>
            <prophead>
                <proptypehd>Property</proptypehd>
                <propvaluehd>Value</propvaluehd>
                <propdeschd>Description</propdeschd>
            </prophead>
            <property>
                <proptype>Property Name</proptype>
                <propvalue>Value</propvalue>
                <propdesc>Description of the property.</propdesc>
            </property>
        </properties>
    </refbody>
</reference>
`;

        default: // topic
            return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">
<topic id="${id}">
    <title>Topic Title</title>
    <shortdesc>Brief description of this topic.</shortdesc>
    <body>
        <p>Topic content goes here.</p>
        <section>
            <title>Section Title</title>
            <p>Additional content.</p>
        </section>
    </body>
</topic>
`;
    }
}

/**
 * Generate DITA map content
 * Exported for testing
 */
export function generateMapContent(id: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map id="${id}">
    <title>Map Title</title>
    <topicref href="topic1.dita">
        <topicref href="subtopic1.dita"/>
        <topicref href="subtopic2.dita"/>
    </topicref>
    <topicref href="topic2.dita"/>
</map>
`;
}

/**
 * Generate DITA bookmap content
 * Exported for testing
 */
export function generateBookmapContent(title: string, id: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE bookmap PUBLIC "-//OASIS//DTD DITA BookMap//EN" "bookmap.dtd">
<bookmap id="${id}">
    <booktitle>
        <mainbooktitle>${title}</mainbooktitle>
    </booktitle>
    <bookmeta>
        <author>Author Name</author>
        <critdates>
            <created date="${new Date().toISOString().split('T')[0]}"/>
        </critdates>
    </bookmeta>
    <frontmatter>
        <booklists>
            <toc/>
        </booklists>
    </frontmatter>
    <chapter href="chapter1.ditamap">
        <topicref href="introduction.dita"/>
    </chapter>
    <chapter href="chapter2.ditamap">
        <topicref href="getting-started.dita"/>
    </chapter>
    <backmatter>
        <booklists>
            <indexlist/>
        </booklists>
    </backmatter>
</bookmap>
`;
}
