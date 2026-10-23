import stylistic from '@stylistic/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  stylistic.configs.customize({ indent: 2, quotes: 'single', semi: true, jsx: true }),
  {
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      'no-warning-comments': ['error', { terms: ['todo', 'fixme'], location: 'anywhere' }],
      '@stylistic/max-len': ['warn', { code: 120, ignoreStrings: true, ignoreTemplateLiterals: true }],
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'playwright-report/**', 'test-results/**']),
]);

export default eslintConfig;
