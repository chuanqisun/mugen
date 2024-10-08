import { defineConfig } from "vite";
import { htmlPlugin } from "./devtools/compile";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [await htmlPlugin()],
});
