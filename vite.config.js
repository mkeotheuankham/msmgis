import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This allows access from the Ngrok URL
    allowedHosts: [
      "deciding-winning-yak.ngrok-free.app",
      // You can add other hosts here if needed
      // 'another-host.com',
    ],
  },
});
