import * as assert from 'assert';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { translateMarkdownFile } from '../commands/translateMarkdown';
import { MarkdownTranslator } from '../markdown/markdownTranslator';
import { TranslationService } from '../translation/translationService';
import { FixtureTranslationProvider } from './helpers/fixtureTranslationProvider';

suite('Translate Markdown command', function () {
    this.timeout(15000);
    let directory: string;
    let warnings: string[];
    let errors: string[];
    let successes: string[];
    let opened: string[];
    let choice: string | undefined;
    let progressCount: number;
    let savedLanguage: string | undefined;
    const restore: (() => void)[] = [];
    function override(object: object, key: string, value: unknown): void {
        const descriptor = Object.getOwnPropertyDescriptor(object, key);
        Object.defineProperty(object, key, { configurable: true, value });
        restore.push(() => {
            if (descriptor) {
                Object.defineProperty(object, key, descriptor);
            } else {
                Reflect.deleteProperty(object, key);
            }
        });
    }
    function active(content: string, language = 'markdown', untitled = false): void {
        override(vscode.window, 'activeTextEditor', { document: {
            getText: () => content, languageId: language, isUntitled: untitled,
            uri: untitled ? vscode.Uri.parse('untitled:Untitled-1') : vscode.Uri.file(path.join(directory, 'README.md')),
        } });
    }
    const fixtureTranslator = () => new MarkdownTranslator(new TranslationService(new FixtureTranslationProvider()));
    setup(async () => {
        directory = await fs.mkdtemp(path.join(os.tmpdir(), 'devlingo-command-'));
        warnings = []; errors = []; successes = []; opened = []; choice = undefined; progressCount = 0;
        savedLanguage = vscode.workspace.getConfiguration('devlingo').inspect<string>('targetLanguage')?.globalValue;
        await vscode.workspace.getConfiguration('devlingo').update('targetLanguage', 'fr', vscode.ConfigurationTarget.Global);
        override(vscode.window, 'showWarningMessage', async (message: string) => { warnings.push(message); return choice; });
        override(vscode.window, 'showErrorMessage', async (message: string) => { errors.push(message); });
        override(vscode.window, 'showInformationMessage', async (message: string) => { successes.push(message); });
        override(vscode.window, 'showTextDocument', async (document: vscode.TextDocument) => { opened.push(document.uri.fsPath); });
        override(vscode.window, 'withProgress', async (options: vscode.ProgressOptions, task: () => Promise<void>) => {
            assert.strictEqual(options.location, vscode.ProgressLocation.Notification);
            assert.strictEqual(options.title, 'DevLingo: Translating README.md...');
            progressCount++;
            return task();
        });
    });
    teardown(async () => {
        while (restore.length) {
            restore.pop()!();
        }
        await vscode.workspace.getConfiguration('devlingo').update('targetLanguage', savedLanguage, vscode.ConfigurationTarget.Global);
        await fs.rm(directory, { recursive: true, force: true });
    });
    test('Warns without an active editor', async () => {
        override(vscode.window, 'activeTextEditor', undefined);
        await translateMarkdownFile(fixtureTranslator());
        assert.ok(warnings[0].includes('Open a Markdown file'));
        assert.strictEqual(progressCount, 0);
    });
    test('Warns for non-Markdown and untitled documents without translating', async () => {
        const translator = new MarkdownTranslator(new TranslationService({ async translate() { assert.fail('Must not translate'); } }));
        active('Hello', 'typescript');
        await translateMarkdownFile(translator);
        assert.ok(warnings[0].includes('not a Markdown'));
        active('Hello', 'markdown', true);
        await translateMarkdownFile(translator);
        assert.ok(warnings[1].includes('Save the Markdown file'));
        assert.deepStrictEqual(await fs.readdir(directory), []);
    });
    test('Creates and opens a translation using the setting, preserving the original', async () => {
        const original = '# DevLingo\n\n```bash\nnpm install\n```';
        await fs.writeFile(path.join(directory, 'README.md'), original);
        active(original);
        await translateMarkdownFile(fixtureTranslator());
        assert.strictEqual(await fs.readFile(path.join(directory, 'README.md'), 'utf8'), original);
        const translated = await fs.readFile(path.join(directory, 'README.fr.md'), 'utf8');
        assert.strictEqual(translated, '# \\[fr\\] DevLingo\n\n```bash\nnpm install\n```');
        assert.deepStrictEqual(opened, [path.join(directory, 'README.fr.md')]);
        assert.ok(successes[0].includes('README.fr.md created successfully'));
        assert.strictEqual(progressCount, 1);
        assert.deepStrictEqual(errors, []);
    });
    test('Uses the configured target language', async () => {
        await vscode.workspace.getConfiguration('devlingo').update('targetLanguage', 'de', vscode.ConfigurationTarget.Global);
        active('Hello');
        await translateMarkdownFile(fixtureTranslator());
        assert.strictEqual(await fs.readFile(path.join(directory, 'README.de.md'), 'utf8'), '\\[de\\] Hello');
    });
    test('Cancels an existing output without translating or writing', async () => {
        const target = path.join(directory, 'README.fr.md');
        await fs.writeFile(target, 'Existing');
        active('Hello');
        choice = 'Cancel';
        const translator = new MarkdownTranslator(new TranslationService({ async translate() { assert.fail('Must not translate after cancellation'); } }));
        await translateMarkdownFile(translator);
        assert.strictEqual(await fs.readFile(target, 'utf8'), 'Existing');
        assert.strictEqual(progressCount, 0);
        assert.deepStrictEqual(opened, []);
    });
    test('Replaces existing output only after explicit confirmation', async () => {
        const target = path.join(directory, 'README.fr.md');
        await fs.writeFile(target, 'Existing');
        active('Hello');
        choice = 'Replace';
        await translateMarkdownFile(fixtureTranslator());
        assert.strictEqual(await fs.readFile(target, 'utf8'), '\\[fr\\] Hello');
        assert.ok(warnings[0].includes('already exists'));
    });
    test('Requires confirmation if the output appears during translation', async () => {
        const target = path.join(directory, 'README.fr.md');
        active('Hello');
        choice = 'Cancel';
        const translator = new MarkdownTranslator(new TranslationService({ async translate() {
            await fs.writeFile(target, 'Created concurrently');
            return 'Translated';
        } }));
        await translateMarkdownFile(translator);
        assert.strictEqual(await fs.readFile(target, 'utf8'), 'Created concurrently');
        assert.ok(warnings[0].includes('already exists'));
        assert.deepStrictEqual(successes, []);
        assert.deepStrictEqual(await fs.readdir(directory), ['README.fr.md']);
    });
    test('Does not replace a dirty translated document', async () => {
        const target = path.join(directory, 'README.fr.md');
        await fs.writeFile(target, 'Existing');
        override(vscode.workspace, 'textDocuments', [{ uri: vscode.Uri.file(target), isDirty: true }]);
        active('Hello');
        choice = 'Replace';
        await translateMarkdownFile(fixtureTranslator());
        assert.strictEqual(await fs.readFile(target, 'utf8'), 'Existing');
        assert.ok(warnings[0].includes('unsaved translated file'));
    });
    test('Refuses a translated path aliased by the original symlink', async () => {
        const target = path.join(directory, 'README.fr.md');
        const original = path.join(directory, 'README.md');
        await fs.writeFile(target, 'Original');
        await fs.symlink(target, original);
        active('Original');
        choice = 'Replace';
        await translateMarkdownFile(fixtureTranslator());
        assert.strictEqual(await fs.readFile(original, 'utf8'), 'Original');
        assert.ok(warnings[0].includes('original file'));
        assert.deepStrictEqual(successes, []);
    });
    test('Leaves no partial output when translation fails halfway', async () => {
        active('# Heading\n\nParagraph');
        let calls = 0;
        const translator = new MarkdownTranslator(new TranslationService({ async translate() {
            if (++calls === 2) {
                throw new Error('Provider failure');
            }
            return 'Translated';
        } }));
        await translateMarkdownFile(translator);
        assert.deepStrictEqual(await fs.readdir(directory), []);
        assert.ok(errors[0].includes('Unable to translate'));
        assert.deepStrictEqual(opened, []);
    });
    test('Reports filesystem failures without leaving temporary files', async () => {
        active('Hello');
        const target = path.join(directory, 'README.fr.md');
        await fs.mkdir(target);
        choice = 'Replace';
        await translateMarkdownFile(fixtureTranslator());
        assert.ok(errors[0].includes('Unable to translate'));
        assert.deepStrictEqual(await fs.readdir(directory), ['README.fr.md']);
    });
    test('Safely publishes an empty document', async () => {
        active('');
        await translateMarkdownFile(fixtureTranslator());
        assert.strictEqual(await fs.readFile(path.join(directory, 'README.fr.md'), 'utf8'), '');
        assert.strictEqual(successes.length, 1);
    });
});
