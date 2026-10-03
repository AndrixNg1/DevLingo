import * as assert from 'assert';
import * as vscode from 'vscode';
import { CommentTranslationHover } from '../hover/commentTranslationHover';
import { TranslationService } from '../translation/translationService';
import { MockTranslationProvider } from '../translation/providers/mockTranslationProvider';
import { getTargetLanguage } from '../config/settings';
import { languages } from '../config/languages';
import { commentLanguageIds } from '../comments/commentExtractor';

suite('Comment translation hover', function () {
    this.timeout(15000);
    let savedLanguage: string | undefined;
    setup(async () => {
        const config = vscode.workspace.getConfiguration('devlingo');
        savedLanguage = config.inspect<string>('targetLanguage')?.globalValue;
        await config.update('targetLanguage', 'fr', vscode.ConfigurationTarget.Global);
    });
    teardown(async () => {
        await vscode.workspace.getConfiguration('devlingo').update(
            'targetLanguage', savedLanguage, vscode.ConfigurationTarget.Global,
        );
    });

    test('Manifest languages and activation events match the reusable definitions', () => {
        const extension = vscode.extensions.all.find(item => item.packageJSON.name === 'devlingo');
        assert.ok(extension);
        const setting = extension.packageJSON.contributes.configuration.properties['devlingo.targetLanguage'];
        assert.deepStrictEqual(setting.enum, languages.map(language => language.code));
        assert.deepStrictEqual(setting.enumDescriptions, languages.map(language => language.label));
        assert.strictEqual(setting.default, 'fr');
        assert.deepStrictEqual(extension.packageJSON.activationEvents, commentLanguageIds.map(id => `onLanguage:${id}`));
    });

    test('Translates through the service, caches requests and preserves the document', async () => {
        let calls = 0;
        const mock = new MockTranslationProvider();
        const hover = new CommentTranslationHover(new TranslationService({ async translate(text, options) {
            calls++;
            return mock.translate(text, options);
        } }));
        const document = await vscode.workspace.openTextDocument({ content: '// Fetch current user', language: 'typescript' });
        const token = new vscode.CancellationTokenSource();
        try {
            const result = await hover.provideHover(document, new vscode.Position(0, 5), token.token);
            assert.ok(result);
            const markdown = result.contents[0] as vscode.MarkdownString;
            assert.ok(markdown.value.includes('**DevLingo**'));
            const expected = new vscode.MarkdownString('**DevLingo**\n\n🌐 ');
            expected.appendText('[fr] Fetch current user');
            assert.strictEqual(markdown.value, expected.value);
            assert.strictEqual(markdown.isTrusted, undefined);
            assert.strictEqual(result.range?.start.character, 0);
            assert.strictEqual(result.range?.end.character, document.getText().length);
            await hover.provideHover(document, new vscode.Position(0, 6), token.token);
            assert.strictEqual(calls, 1);
            await vscode.workspace.getConfiguration('devlingo').update('targetLanguage', 'de', vscode.ConfigurationTarget.Global);
            const german = await hover.provideHover(document, new vscode.Position(0, 6), token.token);
            assert.ok((german?.contents[0] as vscode.MarkdownString).value.includes('de'));
            assert.strictEqual(calls, 2);
            assert.strictEqual(document.getText(), '// Fetch current user');
        } finally {
            token.dispose();
        }
    });

    test('Ignores code, unsupported languages and empty comments without translating', async () => {
        const hover = new CommentTranslationHover(new TranslationService({ async translate() {
            assert.fail('No translation should be requested');
        } }));
        const token = new vscode.CancellationTokenSource();
        try {
            for (const [content, language] of [['const value = 1;', 'typescript'], ['// hello', 'plaintext'], ['// ', 'python'], ['/* */', 'css']]) {
                const document = await vscode.workspace.openTextDocument({ content, language });
                assert.strictEqual(await hover.provideHover(document, new vscode.Position(0, 1), token.token), undefined);
            }
        } finally {
            token.dispose();
        }
    });

    test('Escapes provider output as untrusted Markdown text', async () => {
        const hover = new CommentTranslationHover(new TranslationService({ async translate() {
            return '[Run](command:danger) <img src=x> **bold** `code`';
        } }));
        const document = await vscode.workspace.openTextDocument({ content: '// hello', language: 'javascript' });
        const token = new vscode.CancellationTokenSource();
        try {
            const result = await hover.provideHover(document, new vscode.Position(0, 3), token.token);
            const markdown = result?.contents[0] as vscode.MarkdownString;
            const expected = new vscode.MarkdownString('**DevLingo**\n\n🌐 ');
            expected.appendText('[Run](command:danger) <img src=x> **bold** `code`');
            assert.strictEqual(markdown.value, expected.value);
            assert.ok(!markdown.isTrusted);
            assert.ok(!markdown.supportHtml);
        } finally {
            token.dispose();
        }
    });

    test('Returns undefined for cancelled requests, including cancellation while translating', async () => {
        let resolve!: (value: string) => void;
        let calls = 0;
        const hover = new CommentTranslationHover(new TranslationService({ translate() {
            calls++;
            return new Promise<string>(done => { resolve = done; });
        } }));
        const document = await vscode.workspace.openTextDocument({ content: '// hello', language: 'javascript' });
        const token = new vscode.CancellationTokenSource();
        try {
            const pending = hover.provideHover(document, new vscode.Position(0, 3), token.token);
            token.cancel();
            resolve('hello');
            assert.strictEqual(await pending, undefined);
            assert.strictEqual(await hover.provideHover(document, new vscode.Position(0, 3), token.token), undefined);
            assert.strictEqual(calls, 1);
        } finally {
            token.dispose();
        }
    });

    test('Suppresses stale results when the document changes during translation', async () => {
        let resolve!: (value: string) => void;
        const hover = new CommentTranslationHover(new TranslationService({ translate() {
            return new Promise<string>(done => { resolve = done; });
        } }));
        const document = await vscode.workspace.openTextDocument({ content: '// original', language: 'javascript' });
        const token = new vscode.CancellationTokenSource();
        try {
            const pending = hover.provideHover(document, new vscode.Position(0, 3), token.token);
            const edit = new vscode.WorkspaceEdit();
            edit.insert(document.uri, new vscode.Position(0, 0), '\n');
            assert.ok(await vscode.workspace.applyEdit(edit));
            resolve('original');
            assert.strictEqual(await pending, undefined);
        } finally {
            token.dispose();
        }
    });

    test('Suppresses failures and retries on the next hover', async () => {
        let calls = 0;
        const hover = new CommentTranslationHover(new TranslationService({ async translate() {
            if (++calls === 1) {
                throw new Error('Temporary failure');
            }
            return 'hello';
        } }));
        const document = await vscode.workspace.openTextDocument({ content: '# hello', language: 'python' });
        const token = new vscode.CancellationTokenSource();
        try {
            assert.strictEqual(await hover.provideHover(document, new vscode.Position(0, 3), token.token), undefined);
            assert.ok(await hover.provideHover(document, new vscode.Position(0, 3), token.token));
            assert.strictEqual(calls, 2);
        } finally {
            token.dispose();
        }
    });

    test('Reads the configured language and falls back for invalid configuration', async () => {
        assert.strictEqual(getTargetLanguage(), 'fr');
        await vscode.workspace.getConfiguration('devlingo').update('targetLanguage', 'es', vscode.ConfigurationTarget.Global);
        assert.strictEqual(getTargetLanguage(), 'es');
        await vscode.workspace.getConfiguration('devlingo').update('targetLanguage', 'unknown', vscode.ConfigurationTarget.Global);
        assert.strictEqual(getTargetLanguage(), 'fr');
    });

    test('Registers the hover provider with VS Code', async () => {
        const extension = vscode.extensions.all.find(item => item.packageJSON.name === 'devlingo');
        assert.ok(extension);
        await extension.activate();
        const document = await vscode.workspace.openTextDocument({ content: '// Registered hover', language: 'typescript' });
        const results = await vscode.commands.executeCommand<vscode.Hover[]>(
            'vscode.executeHoverProvider', document.uri, new vscode.Position(0, 5),
        );
        assert.ok(results?.some(result => result.contents.some(content =>
            content instanceof vscode.MarkdownString && content.value.includes('**DevLingo**')
            && content.value.includes('Registered') && content.value.includes('hover'),
        )));
    });
});
