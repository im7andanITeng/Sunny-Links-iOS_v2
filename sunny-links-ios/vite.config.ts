// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * TanStack devtools injects a `data-tsd-source` attribute into every JSX element
 * in development. react-three-fiber reads dashed props as pierced paths
 * (`data-tsd-source` -> `instance.data["tsd-source"]`) and throws when that
 * target is undefined, which blanks the whole canvas. The annotation is only a
 * "go to source" nicety, so drop it from files that render three.js elements.
 */
const stripTsdSourceFromThree = () => ({
  name: "strip-tsd-source-from-three",
  enforce: "post" as const,
  transform(code: string, id: string) {
    const file = id.split("?")[0] ?? "";
    if (!/\.(jsx|tsx|js)$/.test(file)) return null;
    if (!code.includes("data-tsd-source")) return null;
    // only files that render three.js elements
    if (!code.includes("@react-three")) return null;
    return code
      .replace(/,\s*"data-tsd-source"\s*:\s*"[^"]*"/g, "")
      .replace(/"data-tsd-source"\s*:\s*"[^"]*"\s*,/g, "")
      .replace(/"data-tsd-source"\s*:\s*"[^"]*"/g, "")
      .replace(/\s*data-tsd-source\s*=\s*"[^"]*"/g, "");
  },
});

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [stripTsdSourceFromThree()],
  },
});
