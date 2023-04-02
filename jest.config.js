/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/*.test.ts"],
    moduleNameMapper: {
        "^require-context$": "<rootDir>/__mocks__/require-context-mock",
    },
    globals: {
        "ts-jest": {
            useESM: true,
        },
    },
    setupFiles: ["<rootDir>/jest.setup.js"],
};
