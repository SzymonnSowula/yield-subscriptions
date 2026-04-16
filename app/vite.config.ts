import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [react(), nodePolyfills()],
  server: {
    host: "0.0.0.0",
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
  },
});
