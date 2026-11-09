import { defineConfig } from "vite";

// Served at research.californiacompute.org/explorer/ by its own Worker (wrangler.jsonc). The Worker matches assets by
// full path, so the build goes to dist/explorer/. The library's fonts, wordmark and icons load from the library's own
// paths on the same host; in dev they are proxied from the live library. Vite's dev server puts the base in front of
// the HTML's /images and /favicons paths (the build leaves them as written), so the proxy takes it off again.
const fromLibrary = { target: "https://research.californiacompute.org", changeOrigin: true, rewrite: (p: string) => p.replace(/^\/explorer/, "") };

export default defineConfig({
  base: "/explorer/",
  server: { proxy: { "/fonts": fromLibrary, "/explorer/images": fromLibrary, "/explorer/favicons": fromLibrary } },
  build: { outDir: "dist/explorer", emptyOutDir: true, chunkSizeWarningLimit: 1200 },
});
