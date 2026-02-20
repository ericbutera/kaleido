import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  plugins: [react(), dts({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "kaleido",
      fileName: "index",
      formats: ["es"],
    },
    outDir: "dist",
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react-router-dom",
        "react-hook-form",
        "react-hot-toast",
        "@tanstack/react-query",
        "@fortawesome/fontawesome-svg-core",
        "@fortawesome/free-solid-svg-icons",
        "@fortawesome/react-fontawesome",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
});
