/**
 * Shared type definitions used across the LSP server.
 * Lives in utils/ to avoid circular dependencies between settings and features.
 */

/** DITA version type for rule filtering. */
export type DitaVersion = '1.0' | '1.1' | '1.2' | '1.3' | '2.0' | 'unknown';

/** Rule category for configuration filtering. */
export type RuleCategory = 'mandatory' | 'recommendation' | 'authoring' | 'accessibility';
