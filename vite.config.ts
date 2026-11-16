import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command, mode }) => ({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  define: {
    __XHAKA_LOCAL_DEMO__: JSON.stringify(
      command === "serve" && loadEnv(mode, process.cwd(), "VITE_").VITE_XHAKINHA_DEMO === "true",
    ),
  },
  server: { proxy: { "/api": "http://127.0.0.1:3001" } },
}));
