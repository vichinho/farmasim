import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/features/farmasim-3d/player/first-person-player.tsx"],
    rules: {
      // React Three Fiber uses an imperative frame loop for camera transforms.
      "react-hooks/immutability": "off",
    },
  },
  {
    files: ["src/features/farmasim-3d/world/pharmacy-world.tsx"],
    rules: {
      // CanvasTexture is created/disposed as an external Three.js resource.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
