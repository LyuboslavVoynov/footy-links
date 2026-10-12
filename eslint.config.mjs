import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: [".next/**", "node_modules/**", "playwright-report/**", "test-results/**", "next-env.d.ts", "prisma/**/*.js", "scripts/**/*.js"] },
  ...tseslint.configs.recommended,
);
