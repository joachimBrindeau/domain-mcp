export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Permit subjects up to 100 chars to match biome's 100-col line width.
    'header-max-length': [2, 'always', 100],
    // Scopes mirror the top-level areas of src/ so messages stay
    // grep-able alongside the file layout.
    'scope-enum': [
      2,
      'always',
      [
        'client',
        'register',
        'normalize',
        'errors',
        'prompts',
        'resources',
        'schemas',
        'tools',
        'constants',
        'tests',
        'ci',
        'deps',
        'docs',
        'release',
      ],
    ],
  },
};
