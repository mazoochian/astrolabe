import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    preset: "node-server",
    compat: true,
  },
  ssr: true,
  vite: {
    plugins: [tailwindcss()],
  },
});
