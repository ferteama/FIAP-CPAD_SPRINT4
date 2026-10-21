/** Testes unitários das funções puras (sem React Native). Rodar: npm test */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        diagnostics: true,
        tsconfig: {
          module: "commonjs",
          target: "es2020",
          strict: true,
          esModuleInterop: true,
          types: ["jest", "node"],
          skipLibCheck: true,
        },
      },
    ],
  },
};
