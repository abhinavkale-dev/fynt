import { nextJsConfig } from "@repo/eslint-config/next-js";
export default [
    {
        ignores: [
            '.next/**',
            '.next-build/**',
            'dist/**',
        ],
    },
    ...nextJsConfig,
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
];
