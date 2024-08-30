import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    "process.env.VITE_API_BACKEND_URL": JSON.stringify(process.env.VITE_API_BACKEND_URL),
  },
  plugins: [ react()],
  base: "/",
  build: {
    lib: {
      entry: "src/index.jsx",
      name: "ChatbotComponent",
      fileName: (format) => `bundle.${format}.js`,
    },
  },
  rollupOptions: {
    output: {
      globals: {
        react: "React",
        "react-dom": "ReactDOM",
      },
      format: "iife", // IIFE for browser usage
    },
  },
  server: {
    port: 3000, // Optional: specify the development server port
  },
});
