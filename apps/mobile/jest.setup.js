// Mock Expo's lazily-installed globals to avoid "import outside test scope" errors
globalThis.__ExpoImportMetaRegistry = { url: 'file://test' };

// structuredClone is built-in in Node 17+; polyfill for older Jest environments
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}
