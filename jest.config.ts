export default {
  globals: {
    extensionsToTreatAsEsm: [".ts", ".js"],
    "ts-jest": {
      // without this, you git really frustrating errors.
      useESM: true,
      tsconfig: "<rootDir>/tsconfig.jest.json",
    },
  },

  // this preset is absurdly important and (for me) was really a PITA to discover!
  preset: "ts-jest/presets/js-with-ts-esm",

  // also important to not have anything in here
  transformIgnorePatterns: [],
  moduleNameMapper: {
    "(.+)\\.js": "$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "dist"],
};
