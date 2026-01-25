/**
 * Global Constants
 * Centralized configuration and magic numbers for DitaCraft
 */

/**
 * Maximum number of link matches for regex operations
 * Used in key space resolution and link finding to prevent ReDoS attacks
 */
export const MAX_LINK_MATCHES = 10000;

/**
 * Maximum number of map references to extract
 * Used in key space resolution to limit recursion depth
 */
export const MAX_MAP_REFERENCES = 1000;

/**
 * Time constants in milliseconds
 * Used for cache TTL and debouncing operations
 */
export const TIME_CONSTANTS = {
    ONE_MINUTE: 60 * 1000,
    FIVE_MINUTES: 5 * 60 * 1000,
    TEN_MINUTES: 10 * 60 * 1000,
    ONE_HOUR: 60 * 60 * 1000,
    ONE_DAY: 24 * 60 * 60 * 1000
};

/**
 * Cache configuration defaults
 * Used for key space caching and other cache operations
 */
export const CACHE_DEFAULTS = {
    DEFAULT_TTL_MINUTES: 5,
    MAX_KEY_SPACES: 10,
    ROOT_MAP_CACHE_TTL: 60 * 1000 // 1 minute
};

/**
 * Debouncing constants
 * Used for file watcher debouncing
 */
export const DEBOUNCE_CONSTANTS = {
    FILE_WATCHER_DEBOUNCE_MS: 300,
    MIN_CLEANUP_INTERVAL_MS: 5 * 60 * 1000
};

/**
 * DITA file extensions
 * Used for file type detection and validation
 */
export const DITA_EXTENSIONS = {
    TOPIC: '.dita',
    MAP: '.ditamap',
    BOOKMAP: '.bookmap',
    ALL: ['.dita', '.ditamap', '.bookmap']
};

/**
 * Common DITA element names
 * Used for validation and parsing
 */
export const DITA_ELEMENTS = {
    TOPIC_TYPES: ['topic', 'concept', 'task', 'reference'],
    MAP_TYPES: ['map', 'bookmap'],
    KEYDEF_ELEMENTS: ['keydef', 'topicref', 'chapter', 'appendix', 'part'],
    MAPREF_ELEMENTS: ['mapref', 'topicref', 'chapter', 'appendix', 'part']
};

/**
 * Validation engine options
 * Used for XML validation configuration
 */
export const VALIDATION_ENGINES = {
    TYPESXML: 'typesxml',
    XMLLINT: 'xmllint',
    BUILT_IN: 'built-in'
} as const;

/**
 * DITA-OT related constants
 * Used for DITA-OT integration
 */
export const DITA_OT = {
    DEFAULT_TRANSTYPES: ['html5', 'pdf', 'xhtml', 'epub'],
    CONFIG_KEY: 'ditacraft.ditaOtPath',
    OUTPUT_DIR: 'out'
};

/**
 * VS Code configuration keys
 * Centralized configuration key management
 */
export const CONFIG_KEYS = {
    DITACRAFT_NAMESPACE: 'ditacraft',
    MAX_LINK_MATCHES: 'maxLinkMatches',
    KEY_SPACE_CACHE_TTL: 'keySpaceCacheTtlMinutes',
    VALIDATION_ENGINE: 'validationEngine',
    DITA_OT_PATH: 'ditaOtPath'
};

/**
 * UI-related timeout constants
 * Used for status bar messages and notifications
 */
export const UI_TIMEOUTS = {
    /** Duration for status bar messages in milliseconds */
    STATUS_BAR_MESSAGE_MS: 5000
};

/**
 * Process management constants
 * Used for DITA-OT process lifecycle management
 */
export const PROCESS_CONSTANTS = {
    /** Grace period to wait for process termination before force kill (ms) */
    KILL_GRACE_PERIOD_MS: 5000
};