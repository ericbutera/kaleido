import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

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
