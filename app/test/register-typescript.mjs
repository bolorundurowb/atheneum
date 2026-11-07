import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Exercise application classes with real Angular injection and RxJS in Node.
// Ionic's distribution also needs extension resolution outside the CLI bundler.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.startsWith('.') &&
          ['ERR_MODULE_NOT_FOUND', 'ERR_UNSUPPORTED_DIR_IMPORT'].includes(error.code)) {
        for (const suffix of ['.js', '/index.js', '.ts', '/index.ts']) {
          try {
            return nextResolve(specifier + suffix, context);
          } catch {
            // Try the next extension, then report the original resolution error.
          }
        }
      }
      throw error;
    }
  },
  load(url, context, nextLoad) {
    if (url.endsWith('.ts') && !url.includes('/node_modules/')) {
      return {
        format: 'module',
        shortCircuit: true,
        source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
          fileName: fileURLToPath(url),
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
            experimentalDecorators: true,
            useDefineForClassFields: false
          }
        }).outputText
      };
    }
    return nextLoad(url, context);
  }
});

await import('@angular/compiler');
