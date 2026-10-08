import * as assert from 'assert';
import * as vscode from 'vscode';
import { buildCommandCenterItems, openCommandCenter, type CommandCenterState, type CommandCenterItem } from '../ui/commandCenter';
import { languages } from '../config/languages';
import { getProviderMetadata } from '../translation/providers/providerRegistry';
import { changeTargetLanguage, toggleCommentTranslation, registerUICommands } from '../commands/uiCommands';
import { CommentTranslationHover } from '../hover/commentTranslationHover';
import { TranslationService } from '../translation/translationService';

suite('DevLingo command center', () => {
    const state: CommandCenterState = { documentLanguage: 'typescript', hasSelection: false,
        targetLanguage: 'fr', providerId: 'openai', commentsEnabled: true, credentialStatus: 'missing' };
    const actions = (input: CommandCenterState) => buildCommandCenterItems(input).filter(item => item.command);
    test('Hides selection and Markdown actions when unavailable, including no editor', () => {
        for (const documentLanguage of ['typescript', undefined]) {
            const items = actions({ ...state, documentLanguage });
            assert.ok(!items.some(item => item.command === 'devlingo.translateSelection'));
            assert.ok(!items.some(item => item.command === 'devlingo.translateMarkdown'));
            assert.ok(items.some(item => item.command === 'devlingo.openSettings'));
        }
    });
    test('Shows Markdown and selection actions only for their contexts', () => {
        const markdown = actions({ ...state, documentLanguage: 'markdown', hasSelection: true });
        assert.deepStrictEqual(markdown.slice(0, 2).map(item => item.command), ['devlingo.translateSelection', 'devlingo.translateMarkdown']);
        const code = actions({ ...state, hasSelection: true });
        assert.strictEqual(code[0].command, 'devlingo.translateSelection');
        assert.ok(!code.some(item => item.command === 'devlingo.translateMarkdown'));
        assert.ok(actions({ ...state, documentLanguage: 'markdown' }).some(item => item.command === 'devlingo.translateMarkdown'));
    });
    test('Uses centralized language/provider labels and communicates missing credentials', () => {
        for (const language of languages) {
            const items = actions({ ...state, targetLanguage: language.code });
            assert.strictEqual(items.find(item => item.command === 'devlingo.changeTargetLanguage')?.description, `${language.label} (${language.code.toUpperCase()})`);
        }
        for (const providerId of ['openai', 'deepl', 'google'] as const) {
            const items = actions({ ...state, providerId, credentialStatus: 'configured' });
            assert.strictEqual(items.find(item => item.command === 'devlingo.changeTranslationProvider')?.description, getProviderMetadata(providerId).displayName);
        }
        assert.ok(actions(state).find(item => item.command === 'devlingo.changeTranslationProvider')?.description?.includes('API key required'));
        assert.ok(actions(state).find(item => item.command === 'devlingo.configureProviderApiKey')?.detail?.includes('OpenAI'));
        assert.strictEqual(actions({ ...state, providerId: 'test-api-key' }).find(item => item.command === 'devlingo.changeTranslationProvider')?.description, 'Unknown provider · API key required');
    });
    test('Shows enabled/disabled state and groups items using native separators', () => {
        for (const commentsEnabled of [true, false]) {
            const items = buildCommandCenterItems({ ...state, commentsEnabled, hasSelection: true });
            assert.strictEqual(items.find(item => item.command === 'devlingo.toggleCommentTranslation')?.description, commentsEnabled ? 'Enabled' : 'Disabled');
            assert.deepStrictEqual(items.filter(item => item.kind === vscode.QuickPickItemKind.Separator).map(item => item.label), ['Translate', 'Configuration', 'Credentials', 'More']);
            assert.ok(items.filter(item => item.command).every(item => item.label.length > 0));
        }
    });
});

suite('DevLingo native UX routing and settings', () => {
    const restorations: (() => void)[] = [];
    let selected: string | undefined;
    let menu: readonly CommandCenterItem[];
    let picks: vscode.QuickPickOptions | undefined;
    let providerId: string;
    let targetLanguage: string;
    let enabled: boolean;
    let editor: vscode.TextEditor | undefined;
    let workspaceTarget: string | undefined;
    let updates: [string, unknown, vscode.ConfigurationTarget][];
    let executed: [string, unknown[]][];
    function override(object: object, key: string, value: unknown): void {
        const original = Object.getOwnPropertyDescriptor(object, key);
        Object.defineProperty(object, key, { configurable: true, value });
        restorations.push(() => {
            if (original) {
                Object.defineProperty(object, key, original);
            } else {
                Reflect.deleteProperty(object, key);
            }
        });
    }
    suiteSetup(async () => {
        const extension = vscode.extensions.all.find(item => item.packageJSON.name === 'devlingo');
        assert.ok(extension);
        await extension.activate();
    });
    setup(() => {
        providerId = 'google'; targetLanguage = 'fr'; enabled = true; editor = undefined; workspaceTarget = undefined;
        menu = []; updates = []; executed = []; selected = undefined; picks = undefined;
        override(vscode.window, 'activeTextEditor', editor);
        override(vscode.workspace, 'getConfiguration', () => ({
            get: (key: string) => key === 'targetLanguage' ? targetLanguage : key === 'translationProvider' ? providerId : enabled,
            inspect: () => ({ workspaceValue: workspaceTarget }),
            async update(key: string, value: unknown, scope: vscode.ConfigurationTarget) {
                updates.push([key, value, scope]);
                if (key === 'targetLanguage') { targetLanguage = value as string; }
                if (key === 'commentTranslationEnabled') { enabled = value as boolean; }
            },
        }));
        override(vscode.window, 'showQuickPick', async (items: CommandCenterItem[], options: vscode.QuickPickOptions) => {
            menu = items; picks = options;
            return selected === undefined ? undefined : items.find(item => item.command === selected || item.label === selected);
        });
        override(vscode.commands, 'executeCommand', async (id: string, ...args: unknown[]) => { executed.push([id, args]); });
    });
    teardown(() => { while (restorations.length) { restorations.pop()!(); } });
    test('Opening or cancelling the menu never translates and rereads settings every time', async () => {
        const reads: string[] = [];
        const hasKey = async (id: string) => { reads.push(id); return false; };
        await openCommandCenter(hasKey);
        assert.deepStrictEqual(reads, ['google']);
        assert.strictEqual(picks?.title, 'DevLingo');
        assert.deepStrictEqual(executed, []);
        providerId = 'deepl'; targetLanguage = 'de'; enabled = false;
        await openCommandCenter(hasKey);
        assert.deepStrictEqual(reads, ['google', 'deepl']);
        assert.ok(menu.find(item => item.command === 'devlingo.changeTranslationProvider')?.description?.includes('DeepL · API key required'));
        assert.strictEqual(menu.find(item => item.command === 'devlingo.changeTargetLanguage')?.description, 'German (DE)');
        assert.strictEqual(menu.find(item => item.command === 'devlingo.toggleCommentTranslation')?.description, 'Disabled');
        assert.deepStrictEqual(executed, []);
    });
    test('Credential lookup failures remain visible without raw error details', async () => {
        providerId = 'openai';
        await openCommandCenter(async () => { throw new Error('test-api-key'); });
        assert.ok(menu.find(item => item.command === 'devlingo.changeTranslationProvider')?.description?.includes('Unable to check API key'));
        assert.ok(!JSON.stringify(menu).includes('test-api-key'));
    });
    test('Routes configuration and settings actions to existing commands', async () => {
        for (const id of ['devlingo.changeTargetLanguage', 'devlingo.changeTranslationProvider', 'devlingo.toggleCommentTranslation', 'devlingo.configureProviderApiKey', 'devlingo.openSettings']) {
            selected = id;
            await openCommandCenter(async () => true);
            assert.strictEqual(executed.at(-1)?.[0], id);
        }
    });
    test('Uses current editor context and delegates selection/Markdown translation', async () => {
        const document = await vscode.workspace.openTextDocument({ content: '# Hello', language: 'markdown' });
        override(vscode.window, 'activeTextEditor', { document, selection: new vscode.Selection(0, 2, 0, 7) });
        for (const id of ['devlingo.translateSelection', 'devlingo.translateMarkdown']) {
            selected = id;
            await openCommandCenter(async () => true);
            assert.strictEqual(executed.at(-1)?.[0], id);
        }
        override(vscode.window, 'activeTextEditor', { document, selection: new vscode.Selection(0, 0, 0, 0) });
        selected = undefined;
        await openCommandCenter(async () => true);
        assert.ok(!menu.some(item => item.command === 'devlingo.translateSelection'));
        const whitespace = await vscode.workspace.openTextDocument({ content: '  ', language: 'typescript' });
        override(vscode.window, 'activeTextEditor', { document: whitespace, selection: new vscode.Selection(0, 0, 0, 2) });
        await openCommandCenter(async () => true);
        assert.ok(!menu.some(item => item.command === 'devlingo.translateSelection'));
        assert.ok(!menu.some(item => item.command === 'devlingo.translateMarkdown'));
    });
    test('Language picker uses the registry, marks current language and respects cancellation', async () => {
        await changeTargetLanguage();
        assert.deepStrictEqual(menu.map(item => item.label), languages.map(language => language.label));
        assert.strictEqual(menu.find(item => item.label === 'French')?.detail, 'Current');
        assert.deepStrictEqual(updates, []);
        selected = 'German';
        await changeTargetLanguage();
        assert.deepStrictEqual(updates, [['targetLanguage', 'de', vscode.ConfigurationTarget.Global]]);
        await changeTargetLanguage();
        assert.strictEqual(updates.length, 1);
        workspaceTarget = 'de'; selected = 'Spanish';
        await changeTargetLanguage();
        assert.deepStrictEqual(updates.at(-1), ['targetLanguage', 'es', vscode.ConfigurationTarget.Workspace]);
    });
    test('Toggling comments updates the configuration and suppresses pending/inactive hover results', async () => {
        let calls = 0;
        let finish!: (text: string) => void;
        const hover = new CommentTranslationHover(new TranslationService({ translate() { calls++; return new Promise(resolve => { finish = resolve; }); } }));
        const document = await vscode.workspace.openTextDocument({ content: '// Hello', language: 'typescript' });
        const cancellation = new vscode.CancellationTokenSource();
        try {
            const pending = hover.provideHover(document, new vscode.Position(0, 4), cancellation.token);
            await toggleCommentTranslation();
            finish('Bonjour');
            assert.strictEqual(await pending, undefined);
            assert.strictEqual(await hover.provideHover(document, new vscode.Position(0, 4), cancellation.token), undefined);
            assert.strictEqual(calls, 1);
            await toggleCommentTranslation();
            assert.ok(await hover.provideHover(document, new vscode.Position(0, 4), cancellation.token));
            assert.strictEqual(calls, 1);
            assert.deepStrictEqual(updates.map(update => update.slice(0, 2)), [['commentTranslationEnabled', false], ['commentTranslationEnabled', true]]);
        } finally { cancellation.dispose(); }
    });
    test('Registers the native settings action without a custom settings page', async () => {
        const commands = new Map<string, () => Promise<void>>();
        override(vscode.commands, 'registerCommand', (id: string, action: () => Promise<void>) => { commands.set(id, action); return new vscode.Disposable(() => {}); });
        const registration = registerUICommands(async () => false);
        try {
            await commands.get('devlingo.openSettings')!();
            assert.deepStrictEqual(executed, [['workbench.action.openSettings', ['devlingo']]]);
        } finally { registration.dispose(); }
    });
    test('Contributes toolbar/context menus and palette commands with a theme-aware Codicon', async () => {
        const extension = vscode.extensions.all.find(item => item.packageJSON.name === 'devlingo');
        assert.ok(extension);
        const contributions = extension.packageJSON.contributes;
        assert.strictEqual(contributions.commands.find((item: { command: string }) => item.command === 'devlingo.open').icon, '$(globe)');
        assert.deepStrictEqual(contributions.menus['editor/title'], [{ command: 'devlingo.open', group: 'navigation@20' }]);
        assert.strictEqual(contributions.menus['editor/context'][0].when, 'editorHasSelection');
        assert.strictEqual(contributions.menus['editor/context'][1].when, 'resourceLangId == markdown');
        assert.strictEqual(contributions.configuration.properties['devlingo.commentTranslationEnabled'].default, true);
        const registered = await vscode.commands.getCommands(true);
        for (const id of ['open', 'changeTargetLanguage', 'toggleCommentTranslation', 'openSettings']) {
            assert.ok(registered.includes(`devlingo.${id}`));
        }
        assert.strictEqual(contributions.viewsContainers, undefined);
        assert.strictEqual(contributions.views, undefined);
    });
});
