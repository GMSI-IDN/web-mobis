import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    // These components render inside the Payload admin panel and link across the
    // Payload/Next boundary (/admin, /admin/reports, /admin/collections/*). A full
    // page load is intentional there — next/link would client-side navigate into a
    // different React tree and break the admin shell. The rule can't tell the
    // difference, so it's a false positive in exactly these files.
    files: [
      'src/components/AdminNav/**',
      'src/components/Customers/**',
      'src/components/Dashboard/**',
      'src/components/Reports/**',
    ],
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  {
    // Build output dirs. `.next-*` variants are local-only (gitignored) but linting
    // them exhausts the default heap — see the NODE_OPTIONS in package.json's lint script.
    ignores: ['.next/', '.next-*/', 'playwright-report/', 'test-results/'],
  },
]

export default eslintConfig
