import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  format: ["cjs"], // Output CommonJS (for Node.js)
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  splitting: false,
  // Required for NestJS decorators
  esbuildOptions(options) {
    options.keepNames = true;
  },
  // Don't bundle node_modules - let Node resolve them
  external: [
    // Mark all dependencies as external except ESM-only ones
    /^[^./]|^\.[^./]|^\.\.[^/]/, // Default: externalize all bare imports
  ],
  noExternal: [
    // Bundle ESM-only packages so they get converted to CJS
    "@openrouter/sdk",
  ],
  // Copy non-TS files
  onSuccess: async () => {
    const { execSync } = await import("child_process");
    execSync("cp -r src/generated dist/", { stdio: "inherit" });
    console.log("✓ Copied generated files to dist/");
  },
});
