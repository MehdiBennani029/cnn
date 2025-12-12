import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// If your repo is: https://USERNAME.github.io/REPO_NAME/
// then base MUST be "/REPO_NAME/"
const repoName = "cnn";

export default defineConfig(({ mode }) => ({
  base: mode === "development" ? "/" : `/${repoName}/`,

  server: {
    host: "::",
    port: 8080,
  },

  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
