const eslint = require('@eslint/js');
const angular = require('angular-eslint');
const rxjs = require('eslint-plugin-rxjs-x').default;
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.angular/**',
      '**/coverage/**',
      'supabase/functions/**',
      'src/environments/environment.ts',
      'src/environments/environment.prod.ts',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      rxjs,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
      'no-empty': 'warn',
      'no-useless-assignment': 'warn',
      'prefer-const': 'warn',
      '@angular-eslint/no-empty-lifecycle-method': 'warn',
      '@angular-eslint/no-output-native': 'warn',
      '@angular-eslint/no-output-on-prefix': 'warn',
      '@angular-eslint/prefer-inject': 'warn',
      '@angular-eslint/prefer-on-push-component-change-detection': 'warn',
      'rxjs/no-ignored-subscribe': 'warn',
      'rxjs/no-exposed-subjects': 'warn',
      'rxjs/no-unsafe-takeuntil': 'warn',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      // Enable all template rules as warnings by default
      ...Object.fromEntries(
        Object.keys(angular.templatePlugin.rules).map((ruleName) => [
          `@angular-eslint/template/${ruleName}`,
          'warn',
        ]),
      ),
      // Disable i18n — app is Spanish-only, no Angular i18n system in use
      '@angular-eslint/template/i18n': 'off',
      // Disable no-call-expression — too many false positives with Angular signals
      '@angular-eslint/template/no-call-expression': 'off',
      // Disable no-inline-styles — dynamic styles are needed for theme/branding
      '@angular-eslint/template/no-inline-styles': 'off',
      // Raise cyclomatic complexity limit (default 5 is too strict for real templates)
      '@angular-eslint/template/cyclomatic-complexity': ['warn', { maxComplexity: 15 }],
    },
  },
);
