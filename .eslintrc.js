const OFF = 0;
const WARNING = 1;
const ERROR = 2;

module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb',
    'prettier',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    JSX: true, // https://stackoverflow.com/questions/64170868
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['prettier', 'react', 'react-hooks', 'jsx-a11y'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  ignorePatterns: ['node_modules/'],
  rules: {
    'array-bracket-spacing': ERROR,
    'arrow-body-style': [ERROR, 'as-needed'],
    'arrow-parens': [ERROR, 'as-needed'],
    'class-methods-use-this': OFF,
    'comma-dangle': [ERROR, 'always-multiline'],
    'global-require': WARNING,
    'import/imports-first': OFF,
    'import/newline-after-import': OFF,
    'import/no-dynamic-require': OFF,
    'import/no-named-as-default': OFF,
    'import/no-unresolved': ERROR,
    'import/no-webpack-loader-syntax': OFF,
    'import/prefer-default-export': OFF,
    'indent': ERROR,
    'key-spacing': ERROR,
    'keyword-spacing': ERROR,
    'max-len': OFF,
    'newline-per-chained-call': OFF,
    'no-confusing-arrow': OFF,
    'no-console': WARNING,
    'no-multi-spaces': ERROR,
    'no-unused-vars': ERROR,
    'no-use-before-define': OFF,
    'no-spaced-func': ERROR,
    'object-curly-spacing': [ERROR, 'never'],
    'prefer-template': ERROR,
    'semi': [ERROR, 'always'],
    'space-before-blocks': [ERROR, 'always'],
    'space-in-parens': [ERROR, 'never'],
    'space-infix-ops': ERROR,
    'space-unary-ops': ERROR,
    'react/destructuring-assignment': OFF,
    'react/no-array-index-key': OFF, // Sometimes its ok, e.g. non-changing data.
    'react/prop-types': OFF,
    'react/require-default-props': OFF,
    'react/require-extension': OFF,
    'react/self-closing-comp': OFF,
    'react/sort-comp': OFF,
    'react/forbid-prop-types': OFF,
    'react/jsx-closing-tag-location': OFF,
    'react/jsx-first-prop-new-line': [ERROR, 'multiline'],
    'react/jsx-filename-extension': OFF,
    'react/jsx-props-no-spreading': OFF,
    'react/jsx-no-target-blank': OFF,
    'react/jsx-uses-vars': ERROR,
    '@typescript-eslint/no-inferrable-types': OFF,
    '@typescript-eslint/no-use-before-define': [
      ERROR,
      {functions: false, classes: false, variables: true},
    ],
    '@typescript-eslint/no-empty-function': OFF,
    '@typescript-eslint/no-non-null-assertion': OFF, // Have to use type assertion anyways
    '@typescript-eslint/no-unused-vars': [ERROR, {argsIgnorePattern: '^_'}],
    '@typescript-eslint/ban-ts-comment': [
      ERROR,
      {'ts-expect-error': 'allow-with-description'},
    ],
    '@typescript-eslint/ban-types': WARNING,
    '@typescript-eslint/no-shadow': ERROR,
    '@typescript-eslint/no-redeclare': ERROR,
    'jsx-a11y/aria-props': ERROR,
    'jsx-a11y/click-events-have-key-events': WARNING,
    'jsx-a11y/heading-has-content': OFF,
    'jsx-a11y/label-has-associated-control': [
      ERROR,
      {
        // NOTE: If this error triggers, either disable it or add
        // your custom components, labels and attributes via these options
        // See https://github.com/evcohen/eslint-plugin-jsx-a11y/blob/master/docs/rules/label-has-associated-control.md
        controlComponents: ['Input'],
      },
    ],
    'jsx-a11y/label-has-for': OFF,
    'jsx-a11y/mouse-events-have-key-events': ERROR,
    'jsx-a11y/no-noninteractive-element-interactions': WARNING,
    'jsx-a11y/role-has-required-aria-props': ERROR,
    'jsx-a11y/role-supports-aria-props': ERROR,
    'react-hooks/rules-of-hooks': ERROR,
  },
  overrides: [
    {
      files: ['*.js'],
      rules: {
        // Make JS code directly runnable in Node.
        '@typescript-eslint/no-var-requires': OFF,
        '@typescript-eslint/explicit-module-boundary-types': OFF,
      },
    },
  ],
};
