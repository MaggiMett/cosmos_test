import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: "dist/runtime",
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "cosmos-frontend-runtime",
    },
    rollupOptions: {
      external: ["vue", "vue-router"],
    },
  },
});
