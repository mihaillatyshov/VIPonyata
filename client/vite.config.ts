import { resolve } from "node:path";

import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    css: {
        preprocessorOptions: {
            scss: {
                quietDeps: true,
                silenceDeprecations: ["import", "global-builtin", "color-functions", "if-function"],
            },
        },
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                ".js": "jsx",
            },
        },
    },
    resolve: {
        alias: [
            { find: /^assets\/(.*)$/, replacement: resolve(__dirname, "src/assets") + "/$1" },
            { find: /^components\/(.*)$/, replacement: resolve(__dirname, "src/components") + "/$1" },
            { find: /^libs\/(.*)$/, replacement: resolve(__dirname, "src/libs") + "/$1" },
            { find: /^models\/(.*)$/, replacement: resolve(__dirname, "src/models") + "/$1" },
            { find: /^redux\/(.*)$/, replacement: resolve(__dirname, "src/redux") + "/$1" },
            { find: /^requests\/(.*)$/, replacement: resolve(__dirname, "src/requests") + "/$1" },
            { find: /^themes\/(.*)$/, replacement: resolve(__dirname, "src/themes") + "/$1" },
            { find: /^ui\/(.*)$/, replacement: resolve(__dirname, "src/ui") + "/$1" },
            { find: /^validators\/(.*)$/, replacement: resolve(__dirname, "src/validators") + "/$1" },
        ],
    },
    server: {
        proxy: {
            "/api": {
                target: "http://127.0.0.1:5000",
                changeOrigin: true,
            },
            "/uploads": {
                target: "http://127.0.0.1:5000/api",
                changeOrigin: true,
            },
        },
    },
});
