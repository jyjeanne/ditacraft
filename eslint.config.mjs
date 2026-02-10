import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: [
            'out/',
            'dist/',
            '**/*.d.ts',
            'node_modules/',
            '.vscode-test/',
            'server/',
            'test-minimal/',
            'esbuild.js',
            'coverage/',
        ],
    },
    {
        files: ['src/**/*.ts'],
        extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
        rules: {
            '@typescript-eslint/naming-convention': [
                'warn',
                {
                    selector: 'import',
                    format: ['camelCase', 'PascalCase'],
                },
            ],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            'prefer-const': 'warn',
            curly: 'warn',
            eqeqeq: 'warn',
            'no-throw-literal': 'warn',
            semi: 'warn',
        },
    },
);
