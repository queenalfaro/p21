import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            // injectManifest lets us write a custom SW with FCM seam + background sync
            strategies: "injectManifest",
            srcDir: "src",
            filename: "sw.ts",
            registerType: "prompt", // we control when to apply updates
            // SW disabled in dev: Vite dev server deps are not cacheable.
            // Test PWA with: pnpm build && pnpm preview
            devOptions: {
                enabled: false,
            },
            injectManifest: {
                // Exclude analytics and large SW-unrelated assets from precache
                globPatterns: ["**/*.{js,css,html,svg,woff2}"],
            },
            manifest: {
                name: "Event App",
                short_name: "EventApp",
                description: "Real-time event engagement platform",
                theme_color: "#7c3aed",
                background_color: "#09090b",
                display: "standalone",
                orientation: "portrait-primary",
                scope: "/",
                start_url: "/",
                icons: [
                    {
                        src: "/icons/icon-192.svg",
                        sizes: "192x192",
                        type: "image/svg+xml",
                    },
                    {
                        src: "/icons/icon-512.svg",
                        sizes: "512x512",
                        type: "image/svg+xml",
                    },
                    {
                        src: "/icons/icon-maskable-192.svg",
                        sizes: "192x192",
                        type: "image/svg+xml",
                        purpose: "maskable",
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    test: {
        environment: "node",
        globals: true,
    },
    server: {
        host: true,
        port: 5173,
        strictPort: true,
        watch: {
            ignored: [
                "**/node_modules/**",
                "**/.git/**",
                "**/.pnpm-store/**",
                "**/dist/**",
            ],
        },
    },
});
