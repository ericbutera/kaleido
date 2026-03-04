import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

const localKaleido = path.resolve(
  __dirname,
  "../../../kaleido/typescript/packages/kaleido/src/index.ts",
);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      ...(fs.existsSync(localKaleido)
        ? { "@ericbutera/kaleido": localKaleido }
        : {}),
      "@": path.resolve(__dirname, "src"),
    },
  },
});
