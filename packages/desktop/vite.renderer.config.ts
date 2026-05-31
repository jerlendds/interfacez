import { resolve } from "node:path";
import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@nodebody\/editor-markdown$/,
        replacement: resolve(__dirname, "../editor-markdown/src/index.ts"),
      },
      {
        find: /^@nodebody\/editor-markdown\/markdown-editor\.css$/,
        replacement: resolve(
          __dirname,
          "../editor-markdown/src/markdown-editor.css",
        ),
      },
      {
        find: /^@nodebody\/editor-markdown\/(.*)$/,
        replacement: resolve(__dirname, "../editor-markdown/src/$1"),
      },
      {
        find: /^@nodebody\/ui$/,
        replacement: resolve(__dirname, "../ui/src/index.ts"),
      },
      {
        find: /^@nodebody\/ui\/index\.css$/,
        replacement: resolve(__dirname, "../ui/src/index.css"),
      },
      {
        find: /^@nodebody\/ui\/(.*)$/,
        replacement: resolve(__dirname, "../ui/src/$1"),
      },
    ],
  },
});
