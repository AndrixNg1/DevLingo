import * as assert from 'assert';

import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	test('Registers the selection command on activation', async () => {
		const extension = vscode.extensions.all.find(item => item.packageJSON.name === 'devlingo');
		assert.ok(extension, 'DevLingo must be available');
		await extension.activate();
		assert.ok((await vscode.commands.getCommands(true)).includes('devlingo.translateSelection'));
	});
});
