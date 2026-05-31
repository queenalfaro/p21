import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"
import prettier from "eslint-config-prettier"

// FSD layers from highest to lowest (index 0 = highest)
const FSD_LAYERS = ["app", "processes", "pages", "widgets", "features", "entities", "shared"]

// For each layer, build the list of higher layers it cannot import from.
// Uses @/ alias which is the project-wide convention for cross-layer imports.
function buildRestrictedImports(currentLayer) {
    const currentIdx = FSD_LAYERS.indexOf(currentLayer)
    const forbidden = FSD_LAYERS.slice(0, currentIdx) // all layers above current
    if (forbidden.length === 0) return []
    return [
        {
            group: forbidden.map((l) => `@/${l}/*`),
            message: `'${currentLayer}' cannot import from higher layers: ${forbidden.join(", ")}`,
        },
    ]
}

export default defineConfig([
    globalIgnores(["dist"]),

    // Base rules for all TS/TSX files
    {
        files: ["**/*.{ts,tsx}"],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            globals: globals.browser,
        },
    },

    // shadcn/ui components intentionally export both components and utilities
    // (e.g. buttonVariants alongside Button). Disable react-refresh restriction here.
    {
        files: ["src/shared/ui/**/*.{ts,tsx}"],
        rules: {
            "react-refresh/only-export-components": "off",
        },
    },

    // FSD layer boundary enforcement using no-restricted-imports.
    // Each layer is forbidden from importing anything above it via the @/ alias.
    // Relative imports are only used within the same slice (not cross-layer), so
    // cross-layer violations via relative paths are prevented by convention.
    ...FSD_LAYERS.flatMap((layer, i) => {
        if (i === 0) return [] // app can import from everything
        const patterns = buildRestrictedImports(layer)
        if (patterns.length === 0) return []
        return [
            {
                files: [`src/${layer}/**/*.{ts,tsx}`],
                rules: {
                    "no-restricted-imports": ["error", { patterns }],
                },
            },
        ]
    }),

    // Prettier — must be last to disable conflicting formatting rules
    prettier,
])
