import { defineConfig } from "vite";

// Served at research.californiacompute.org/explorer/ by its own Worker (wrangler.jsonc). The Worker matches assets by
// full path, so the build goes to dist/explorer/. The library's fonts, wordmark and icons load from the library's own
// paths on the same host; in dev they are proxied from the live library. Vite's dev server puts the base in front of
// the HTML's /images and /favicons paths (the build leaves them as written), so the proxy takes it off again. CSS
// url()s (the footer lettering mask) keep plain /images, so that path is proxied too.
const fromLibrary = { target: "https://research.californiacompute.org", changeOrigin: true, rewrite: (p: string) => p.replace(/^\/explorer/, "") };

// The forms post to /api/*, which the library's Worker answers. Locally, run that Worker (library-site README, Forms).
const api = { target: "http://localhost:8787", changeOrigin: true };

export default defineConfig({
  base: "/explorer/",
  server: { proxy: { "/fonts": fromLibrary, "/explorer/images": fromLibrary, "/images": fromLibrary, "/explorer/favicons": fromLibrary, "/api": api } },
  build: { outDir: "dist/explorer", emptyOutDir: true, chunkSizeWarningLimit: 1200 },
});
