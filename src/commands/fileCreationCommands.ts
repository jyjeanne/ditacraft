/**
 * File Creation Commands
 * Commands for creating new DITA files from templates
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { logger } from '../utils/logger';
import { resolveTemplatesDir, loadTemplateRaw, substitutePlaceholders, TemplateVariables } from '../utils/templateEngine';

// Constants for file name validation
const FILE_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const FILE_NAME_VALIDATION_MESSAGE = 'File name can only contain letters, numbers, hyphens, and underscores';

// Windows reserved filenames that cannot be used
const WINDOWS_RESERVED_NAMES = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
];

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
    // Check for Windows reserved filenames (case-insensitive)
    if (WINDOWS_RESERVED_NAMES.includes(value.toUpperCase())) {
        return `"${value}" is a reserved filename and cannot be used`;
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

/** Resolve the configured `ditacraft.templatesPath`, or undefined if unset. */
function getTemplatesDir(): string | undefined {
    const templatesPath = vscode.workspace.getConfiguration('ditacraft').get<string>('templatesPath', '');
    return resolveTemplatesDir(templatesPath);
}

/** The `{{author}}` placeholder value, or undefined to leave it unsubstituted. */
function getTemplateAuthor(): string | undefined {
    const author = vscode.workspace.getConfiguration('ditacraft').get<string>('templateAuthor', '');
    return author.length > 0 ? author : undefined;
}

/** Today's date as `YYYY-MM-DD`, matching the `{{date}}` template placeholder and the bookmap generator's `<created>` date. */
function todayIso(): string {
    return new Date().toISOString().split('T')[0];
}

/** Turn a validated file name (`my-topic`) into a readable default title (`My Topic`), for prefilling an optional title prompt. */
export function humanizeFileName(fileName: string): string {
    return fileName
        .split(/[-_]+/)
        .filter(part => part.length > 0)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
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

    // Check if file already exists (P1-1 Fix: Use async file operations)
    try {
        await fs.access(filePath);
        // File exists if no error
        logger.warn('File already exists', { filePath });
        vscode.window.showErrorMessage(`File already exists: ${fullFileName}`);
        return;
    } catch {
        // File doesn't exist, continue with creation
    }

    // Write file with error handling (P1-1 Fix: Use async file operations)
    try {
        await fs.writeFile(filePath, options.content, 'utf8');
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

        // Use a custom template (ditacraft.templatesPath/<type>.dita) when one exists;
        // fall back to the built-in skeleton otherwise. Only prompts for an extra
        // title (to fill the template's {{title}}) in the templated path — the
        // built-in generator's own hardcoded "Topic Title" placeholder needs no such
        // prompt, so this stays a no-op when templatesPath is unset (CLAUDE.md-style
        // backward compatibility: existing zero-template behavior is untouched).
        const templatesDir = getTemplatesDir();
        const templateRaw = templatesDir ? await loadTemplateRaw(templatesDir, topicType.value, '.dita') : undefined;

        let content: string;
        if (templateRaw !== undefined) {
            const title = await vscode.window.showInputBox({
                title: 'Topic Title (optional)',
                prompt: "Fills the template's {{title}} placeholder",
                value: humanizeFileName(fileName)
            });
            if (title === undefined) {
                logger.debug('User cancelled template title input');
                return;
            }
            content = substitutePlaceholders(templateRaw, {
                id: fileName, title, author: getTemplateAuthor(), date: todayIso()
            });
            logger.debug('Rendered topic from template', { topicType: topicType.value });
        } else {
            content = generateTopicContent(topicType.value, fileName);
            logger.debug('Generated content', { length: content.length, topicType: topicType.value });
        }

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

        // See newTopicCommand's matching comment: custom template when one
        // exists (ditacraft.templatesPath/map.ditamap), built-in skeleton
        // otherwise, with the extra title prompt only in the templated path.
        const templatesDir = getTemplatesDir();
        const templateRaw = templatesDir ? await loadTemplateRaw(templatesDir, 'map', '.ditamap') : undefined;

        let content: string;
        if (templateRaw !== undefined) {
            const title = await vscode.window.showInputBox({
                title: 'Map Title (optional)',
                prompt: "Fills the template's {{title}} placeholder",
                value: humanizeFileName(fileName)
            });
            if (title === undefined) {
                logger.debug('User cancelled template title input');
                return;
            }
            content = substitutePlaceholders(templateRaw, {
                id: fileName, title, author: getTemplateAuthor(), date: todayIso()
            });
            logger.debug('Rendered map from template');
        } else {
            content = generateMapContent(fileName);
            logger.debug('Generated map content', { length: content.length });
        }

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

        // See newTopicCommand's matching comment: custom template when one
        // exists (ditacraft.templatesPath/bookmap.bookmap), built-in skeleton
        // otherwise. No extra title prompt needed here — bookTitle was
        // already collected above and fills the template's {{title}}.
        const templatesDir = getTemplatesDir();
        const templateRaw = templatesDir ? await loadTemplateRaw(templatesDir, 'bookmap', '.bookmap') : undefined;
        const content = templateRaw !== undefined
            ? substitutePlaceholders(templateRaw, {
                id: fileName, title: bookTitle, author: getTemplateAuthor(), date: todayIso()
            })
            : generateBookmapContent(bookTitle, fileName);
        logger.debug('Generated bookmap content', { length: content.length, fromTemplate: templateRaw !== undefined });

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

type StarterTopicType = 'concept' | 'task' | 'reference' | 'topic';

/**
 * Command: ditacraft.initProject
 * Project Init Wizard — scaffolds a root map (or bookmap), a starter topic
 * set, an optional starter `.ditaval` filter, and the recommended
 * `topics/`/`maps/`/`images/` folder layout, in one guided flow. Built on
 * the same `getWorkspaceFolder()` primitive `newTopicCommand`/
 * `newMapCommand`/`newBookmapCommand` already use — this is mostly wiring
 * those three commands' own building blocks together, not new algorithms.
 */
export async function initProjectCommand(): Promise<void> {
    try {
        const workspaceFolder = getWorkspaceFolder();
        if (!workspaceFolder) {
            return;
        }

        const rootTypePick = await vscode.window.showQuickPick(
            [
                { label: 'Map', description: 'A plain DITA map', value: 'map' as const },
                { label: 'Bookmap', description: 'A book-structured map (front/backmatter, chapters)', value: 'bookmap' as const }
            ],
            { title: 'DITA: Initialize Project (1/4)', placeHolder: 'Select the root map type' }
        );
        if (!rootTypePick) {
            logger.debug('User cancelled root type selection');
            return;
        }

        const title = await vscode.window.showInputBox({
            title: rootTypePick.value === 'bookmap' ? 'Book Title (2/4)' : 'Project Title (2/4)',
            prompt: 'Enter a title for the root map',
            placeHolder: rootTypePick.value === 'bookmap' ? 'User Guide' : 'My Documentation'
        });
        if (!title) {
            logger.debug('User cancelled title input');
            return;
        }

        const rootFileName = await promptForFileName(
            rootTypePick.value === 'bookmap' ? 'user-guide' : 'main',
            'Enter the root map file name (without extension) (3/4)'
        );
        if (!rootFileName) {
            logger.debug('User cancelled root file name input');
            return;
        }

        const topicTypeChoices = await vscode.window.showQuickPick(
            [
                { label: 'Concept', picked: true, value: 'concept' as StarterTopicType },
                { label: 'Task', picked: true, value: 'task' as StarterTopicType },
                { label: 'Reference', picked: false, value: 'reference' as StarterTopicType },
                { label: 'Topic', picked: false, value: 'topic' as StarterTopicType }
            ],
            {
                title: 'Starter Topics (4/4)',
                placeHolder: 'Select topic types to scaffold (space to toggle)',
                canPickMany: true
            }
        );
        // canPickMany's Escape returns undefined -- treated as "no starter
        // topics" rather than cancelling the wizard, since a project with
        // just a root map and no topics yet is a valid, if minimal, outcome
        // (more topics can always be added via "DITA: Create New Topic").
        const topicTypes = topicTypeChoices?.map(c => c.value) ?? [];

        const ditavalChoice = await vscode.window.showQuickPick(
            [
                { label: '$(circle-slash) No filter file', value: false },
                { label: '$(filter) Yes, add a starter .ditaval', value: true }
            ],
            { title: 'Include a Filter File?', placeHolder: 'A .ditaval file lets you conditionally include/exclude content' }
        );
        if (ditavalChoice === undefined) {
            logger.debug('User cancelled ditaval choice');
            return;
        }

        await runProjectInit(workspaceFolder, {
            rootType: rootTypePick.value,
            title,
            rootFileName,
            topicTypes,
            includeDitaval: ditavalChoice.value
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to initialize project', error);
        vscode.window.showErrorMessage(`Failed to initialize project: ${errorMessage}`);
    }
}

interface ProjectInitOptions {
    rootType: 'map' | 'bookmap';
    title: string;
    rootFileName: string;
    topicTypes: StarterTopicType[];
    includeDitaval: boolean;
}

/**
 * Plans every file the wizard would create, checks all of them for
 * pre-existing collisions *before* writing anything (so a name clash
 * aborts cleanly rather than leaving a half-scaffolded project), then
 * writes the folder layout and files.
 */
async function runProjectInit(workspaceFolder: vscode.WorkspaceFolder, options: ProjectInitOptions): Promise<void> {
    const rootExtension = options.rootType === 'bookmap' ? '.bookmap' : '.ditamap';
    const mapsDir = path.join(workspaceFolder.uri.fsPath, 'maps');
    const topicsDir = path.join(workspaceFolder.uri.fsPath, 'topics');
    const imagesDir = path.join(workspaceFolder.uri.fsPath, 'images');

    const rootMapPath = path.join(mapsDir, `${options.rootFileName}${rootExtension}`);
    const topicFiles = options.topicTypes.map(type => ({ type, path: path.join(topicsDir, `${type}.dita`) }));
    const ditavalPath = options.includeDitaval ? path.join(mapsDir, `${options.rootFileName}.ditaval`) : undefined;

    const plannedPaths = [rootMapPath, ...topicFiles.map(t => t.path), ...(ditavalPath ? [ditavalPath] : [])];
    const conflicts = await findExistingPaths(plannedPaths);
    if (conflicts.length > 0) {
        const relative = conflicts.map(p => path.relative(workspaceFolder.uri.fsPath, p)).join(', ');
        vscode.window.showErrorMessage(`DitaCraft: Cannot initialize project — file(s) already exist: ${relative}`);
        return;
    }

    const templatesDir = getTemplatesDir();
    const author = getTemplateAuthor();
    const date = todayIso();

    const topicContents = await Promise.all(topicFiles.map(async ({ type, path: topicPath }) => {
        const topicId = path.basename(topicPath, '.dita');
        const templateRaw = templatesDir ? await loadTemplateRaw(templatesDir, type, '.dita') : undefined;
        const content = templateRaw !== undefined
            ? substitutePlaceholders(templateRaw, { id: topicId, title: humanizeFileName(topicId), author, date })
            : generateTopicContent(type, topicId);
        return { path: topicPath, content };
    }));

    const topicHrefs = topicFiles.map(t => `../topics/${t.type}.dita`);
    const rootTemplateRaw = templatesDir ? await loadTemplateRaw(templatesDir, options.rootType, rootExtension) : undefined;
    const rootVariables: TemplateVariables = { id: options.rootFileName, title: options.title, author, date };
    const rootContent = rootTemplateRaw !== undefined
        ? substitutePlaceholders(rootTemplateRaw, rootVariables)
        : (options.rootType === 'bookmap'
            ? generateInitBookmapContent(options.rootFileName, options.title, topicHrefs)
            : generateInitMapContent(options.rootFileName, options.title, topicHrefs));

    await fs.mkdir(mapsDir, { recursive: true });
    await fs.mkdir(topicsDir, { recursive: true });
    await fs.mkdir(imagesDir, { recursive: true });

    await fs.writeFile(rootMapPath, rootContent, 'utf8');
    for (const { path: topicPath, content } of topicContents) {
        await fs.writeFile(topicPath, content, 'utf8');
    }
    if (ditavalPath) {
        await fs.writeFile(ditavalPath, generateStarterDitavalContent(), 'utf8');
    }

    const fileCount = 1 + topicContents.length + (ditavalPath ? 1 : 0);
    logger.info('Initialized DITA project', {
        rootMap: rootMapPath, topicCount: topicContents.length, includeDitaval: options.includeDitaval
    });

    const document = await vscode.workspace.openTextDocument(rootMapPath);
    await vscode.window.showTextDocument(document);

    vscode.window.showInformationMessage(`DitaCraft: Project initialized — ${fileCount} file(s) created.`);
}

/** Which of `paths` already exist on disk. */
async function findExistingPaths(paths: string[]): Promise<string[]> {
    const existing: string[] = [];
    for (const p of paths) {
        try {
            await fs.access(p);
            existing.push(p);
        } catch {
            // doesn't exist — fine
        }
    }
    return existing;
}

/**
 * Root `<map>` content for the Init Wizard, referencing the topics it
 * actually scaffolded (unlike the standalone `generateMapContent()`, which
 * points at fixed sample filenames since it has no such list to draw on).
 */
function generateInitMapContent(id: string, title: string, topicHrefs: string[]): string {
    const topicrefs = topicHrefs.length > 0
        ? topicHrefs.map(href => `    <topicref href="${href}"/>`).join('\n')
        : '    <!-- Add topicref elements here, or use "DITA: Create New Topic" -->';
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map id="${id}">
    <title>${title}</title>
${topicrefs}
</map>
`;
}

/**
 * Root `<bookmap>` content for the Init Wizard. Unlike the standalone
 * `generateBookmapContent()` (whose chapters reference fixed,
 * never-created `chapterN.ditamap` submaps), this nests `<topicref>`s
 * directly inside a single chapter pointing at the topics actually
 * scaffolded — `chapter`'s content model allows `topicref` children
 * directly (`server/src/data/ditaSchema.ts`), so this needs no submap.
 */
function generateInitBookmapContent(id: string, title: string, topicHrefs: string[]): string {
    const topicrefs = topicHrefs.length > 0
        ? topicHrefs.map(href => `            <topicref href="${href}"/>`).join('\n')
        : '            <!-- Add topicref elements here, or use "DITA: Create New Topic" -->';
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE bookmap PUBLIC "-//OASIS//DTD DITA BookMap//EN" "bookmap.dtd">
<bookmap id="${id}">
    <booktitle>
        <mainbooktitle>${title}</mainbooktitle>
    </booktitle>
    <bookmeta>
        <critdates>
            <created date="${todayIso()}"/>
        </critdates>
    </bookmeta>
    <frontmatter>
        <booklists>
            <toc/>
        </booklists>
    </frontmatter>
    <chapter>
${topicrefs}
    </chapter>
    <backmatter>
        <booklists>
            <indexlist/>
        </booklists>
    </backmatter>
</bookmap>
`;
}

/** Minimal, valid starter `.ditaval` — no DOCTYPE (matches every `.ditaval` in this repo; DITAVAL files don't use one). */
function generateStarterDitavalContent(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<val>
    <!-- Add <prop>/<revprop> rules here to include, exclude, or flag
         content by profiling attribute (e.g. audience, platform, props). -->
</val>
`;
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
            <created date="${todayIso()}"/>
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
