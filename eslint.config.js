const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        // Node.js globals
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        process: "readonly",
        console: "readonly",
        // Browser globals
        window: "readonly",
        document: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      semi: ["error", "always"],
      quotes: ["error", "double"],
      indent: ["error", 2],
      "no-var": "error",
      "prefer-const": "error",
    },
  },
  {
    files: ["markit/main/**/*.js"],
    languageOptions: {
      globals: {
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        process: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "no-console": "warn",
    },
  },
  {
    files: ["markit/renderer/**/*.js"],
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        // Functions shared between renderer files
        unfoldDir: "readonly",
        switchFolderState: "readonly",
        createFile: "readonly",
        fileDblClickListener: "readonly",
        getOrCreateChildUl: "readonly",
        changeSelected: "readonly",
        loadFile: "readonly",
        unloadFile: "readonly",
        $title: "readonly",
      },
    },
  },
];
