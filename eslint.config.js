import js from "@eslint/js";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            "cubism/**",
            "dist/**",
            "coverage/**",
            "types/**",
            "site/**",
            "test.build/**",
            // Live2D runtime
            "core/**",
        ],
    },
    js.configs.recommended,
    tseslint.configs.recommended,
    prettierRecommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/consistent-type-imports": [
                "warn",
                { disallowTypeAnnotations: false },
            ],

            // "warn" is for better DX in IDEs, and will be changed to "error" when running "npm run lint"
            "prettier/prettier": "warn",

            // IDEs already warn about unused vars
            "@typescript-eslint/no-unused-vars": "off",

            // makes code too verbose
            "@typescript-eslint/unbound-method": "off",

            // what's the point?
            "@typescript-eslint/require-await": "off",

            // maybe enable these later
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-explicit-any": "off",

            // entry files use /// <reference path> to pull in the core type declarations
            "@typescript-eslint/triple-slash-reference": ["error", { path: "always" }],

            // "interface X extends Y {}" is used to alias types under a new name
            "@typescript-eslint/no-empty-object-type": [
                "error",
                { allowInterfaces: "with-single-extends" },
            ],
        },
    },
    {
        files: ["**/*.js", "**/*.cjs"],
        extends: [tseslint.configs.disableTypeChecked],
        rules: {
            "@typescript-eslint/no-require-imports": "off",
        },
    },
    {
        files: ["test/**"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
        },
    },
    {
        files: ["**/*.d.ts"],
        rules: {
            "@typescript-eslint/no-empty-object-type": "off",
        },
    },
);
