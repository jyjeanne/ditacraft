/**
 * Central diagnostic code registry for the DitaCraft LSP server.
 *
 * All diagnostic codes used across the extension are defined here to ensure
 * consistency and avoid duplication. Feature files should import codes from
 * this module rather than defining their own string literals.
 */
export const DIAGNOSTIC_CODES = {
    structure: {
        XML_WELLFORMEDNESS: 'DITA-XML-001',
        MISSING_DOCTYPE: 'DITA-STRUCT-001',
        INVALID_ROOT: 'DITA-STRUCT-002',
        MISSING_ID: 'DITA-STRUCT-003',
        MISSING_TITLE: 'DITA-STRUCT-004',
        EMPTY_ELEMENT: 'DITA-STRUCT-005',
        MISSING_BOOKTITLE: 'DITA-STRUCT-006',
        MISSING_MAINBOOKTITLE: 'DITA-STRUCT-007',
        TOPICREF_WITHOUT_TARGET: 'DITA-STRUCT-008',
    },
    contentModel: {
        DISALLOWED_CHILD: 'DITA-CM-001',
        MISSING_REQUIRED_CHILD: 'DITA-CM-002',
        UNKNOWN_ELEMENT: 'DITA-CM-003',
    },
    id: {
        DUPLICATE_ID: 'DITA-ID-001',
        INVALID_ID_FORMAT: 'DITA-ID-002',
        CROSS_FILE_DUPLICATE_ID: 'DITA-ID-003',
    },
    crossRef: {
        MISSING_FILE: 'DITA-XREF-001',
        MISSING_TOPIC_ID: 'DITA-XREF-002',
        MISSING_ELEMENT_ID: 'DITA-XREF-003',
        INCOMPATIBLE_CONREF: 'DITA-XREF-004',
    },
    key: {
        UNDEFINED_KEY: 'DITA-KEY-001',
        KEY_NO_TARGET: 'DITA-KEY-002',
        KEY_MISSING_ELEMENT: 'DITA-KEY-003',
        DUPLICATE_KEY: 'DITA-KEY-004',
    },
    scope: {
        SCOPE_EXTERNAL_RELATIVE: 'DITA-SCOPE-001',
        SCOPE_LOCAL_ABSOLUTE: 'DITA-SCOPE-002',
        SCOPE_MISSING_ON_URL: 'DITA-SCOPE-003',
    },
    profiling: {
        INVALID_PROFILING_VALUE: 'DITA-PROF-001',
    },
    cycle: {
        CIRCULAR_REF: 'DITA-CYCLE-001',
    },
    workspace: {
        UNUSED_TOPIC: 'DITA-ORPHAN-001',
    },
    ditaval: {
        DITAVAL_MISSING_ATT: 'DITA-DITAVAL-001',
        DITAVAL_INVALID_ACTION: 'DITA-DITAVAL-002',
        DITAVAL_MISSING_VAL: 'DITA-DITAVAL-003',
        DITAVAL_DUPLICATE_PROP: 'DITA-DITAVAL-004',
        DITAVAL_MISSING_FLAG_REF: 'DITA-DITAVAL-005',
    },
    performance: {
        LARGE_FILE_SKIPPED: 'DITA-PERF-001',
    },
    schema: {
        DTD_ERROR: 'DITA-DTD-001',
        RNG_ERROR: 'DITA-RNG-001',
    },
} as const;
