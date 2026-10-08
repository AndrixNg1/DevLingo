import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	// Test the minimum supported VS Code version; override with --code-version when needed.
	version: '1.140.0',
	files: 'out/test/**/*.test.js',
});
