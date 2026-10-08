import * as assert from 'assert';
import * as vscode from 'vscode';
import { SecretManager } from '../config/secrets';
import { ProviderResolver, ProviderNotConfiguredError } from '../translation/providers/providerResolver';
import { OpenAITranslationProvider } from '../translation/providers/openaiTranslationProvider';
import { MockTranslationProvider } from '../translation/providers/mockTranslationProvider';
import { registerTranslationFeatures } from '../translation/registerTranslationFeatures';
import { FakeSecretStorage } from './helpers/fakeSecretStorage';

suite('Translation feature provider and credential lifetimes (offline)', () => {
    const restorations: (() => void)[] = [];
    let registration: vscode.Disposable | undefined;
    let configEvents: vscode.EventEmitter<vscode.ConfigurationChangeEvent>;
    let secretEvents: vscode.EventEmitter<vscode.SecretStorageChangeEvent>;
    let storage: FakeSecretStorage;
    let secrets: SecretManager;
    let selected: string;
    let calls: number;
    let hovers: vscode.HoverProvider[];
    let commands: Map<string, (...args: unknown[]) => unknown>;
    let notifications: string[];
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
        // Finish real extension activation before replacing registration APIs in this suite.
        const extension = vscode.extensions.all.find(item => item.packageJSON.name === 'devlingo');
        assert.ok(extension);
        await extension.activate();
    });
    setup(() => {
        configEvents = new vscode.EventEmitter(); secretEvents = new vscode.EventEmitter();
        storage = new FakeSecretStorage();
        secrets = new SecretManager({
            get: key => storage.get(key), store: (key, value) => storage.store(key, value),
            delete: key => storage.delete(key), onDidChange: secretEvents.event,
        });
        selected = 'mock'; calls = 0; hovers = []; commands = new Map(); notifications = [];
        override(vscode.workspace, 'getConfiguration', () => ({ get: (key: string, fallback: unknown) => key === 'translationProvider' ? selected : fallback }));
        override(vscode.workspace, 'onDidChangeConfiguration', configEvents.event);
        override(vscode.commands, 'registerCommand', (id: string, callback: (...args: unknown[]) => unknown) => {
            commands.set(id, callback);
            return new vscode.Disposable(() => { commands.delete(id); });
        });
        override(vscode.languages, 'registerHoverProvider', (_selector: unknown, hover: vscode.HoverProvider) => {
            hovers.push(hover);
            return new vscode.Disposable(() => {});
        });
        override(vscode.window, 'showErrorMessage', async (message: string) => { notifications.push(message); });
    });
    teardown(() => {
        registration?.dispose(); registration = undefined;
        configEvents.dispose(); secretEvents.dispose();
        while (restorations.length) {
            restorations.pop()!();
        }
    });
    class OfflineResolver extends ProviderResolver {
        override async resolve(id: unknown) {
            if (id === 'mock') {
                return new MockTranslationProvider();
            }
            const apiKey = await secrets.getApiKey('openai');
            if (!apiKey) {
                throw new ProviderNotConfiguredError('openai');
            }
            return new OpenAITranslationProvider({ apiKey }, { responses: { async create() {
                calls++;
                return { output_text: 'Bonjour', status: 'completed' };
            } } });
        }
    }
    async function settleRegistration(previousCount: number): Promise<void> {
        for (let attempt = 0; attempt < 50 && hovers.length === previousCount; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 5));
        }
        assert.ok(hovers.length > previousCount, 'Feature registration must refresh');
    }
    test('Switches mock/OpenAI without stale hover cache and refreshes saved, replaced and deleted keys', async () => {
        registration = await registerTranslationFeatures(new OfflineResolver(secrets), secrets);
        const document = await vscode.workspace.openTextDocument({ content: '// Hello', language: 'typescript' });
        const cancellation = new vscode.CancellationTokenSource();
        const hoverText = async () => {
            const result = await hovers.at(-1)!.provideHover(document, new vscode.Position(0, 4), cancellation.token);
            return (result?.contents[0] as vscode.MarkdownString | undefined)?.value;
        };
        try {
            assert.ok((await hoverText())?.includes('Hello'));
            selected = 'openai';
            let count = hovers.length;
            configEvents.fire({ affectsConfiguration: () => true });
            await settleRegistration(count);
            assert.strictEqual(await hoverText(), undefined);
            assert.ok(notifications.some(message => message.includes('requires an API key')));
            await secrets.setApiKey('openai', 'test-api-key');
            count = hovers.length;
            secretEvents.fire({ key: 'devlingo.provider.openai.apiKey' });
            await settleRegistration(count);
            assert.ok((await hoverText())?.includes('Bonjour'));
            assert.ok((await hoverText())?.includes('Bonjour'));
            assert.strictEqual(calls, 1);
            await secrets.setApiKey('openai', 'test-other-key');
            count = hovers.length;
            secretEvents.fire({ key: 'devlingo.provider.openai.apiKey' });
            await settleRegistration(count);
            assert.ok((await hoverText())?.includes('Bonjour'));
            assert.strictEqual(calls, 2);
            await secrets.deleteApiKey('openai');
            count = hovers.length;
            secretEvents.fire({ key: 'devlingo.provider.openai.apiKey' });
            await settleRegistration(count);
            assert.strictEqual(await hoverText(), undefined);
            selected = 'mock'; count = hovers.length;
            configEvents.fire({ affectsConfiguration: () => true });
            await settleRegistration(count);
            assert.ok((await hoverText())?.includes('Hello'));
            assert.strictEqual(calls, 2);
        } finally {
            cancellation.dispose();
        }
    });
    test('Selection uses the configured provider and sends only the selected text', async () => {
        selected = 'openai'; await secrets.setApiKey('openai', 'test-api-key');
        const requests: unknown[] = [];
        class SelectionResolver extends ProviderResolver {
            override async resolve() {
                return new OpenAITranslationProvider({ apiKey: 'test-api-key' }, { responses: { async create(request) {
                    requests.push(request.input);
                    return { output_text: 'Bonjour' };
                } } });
            }
        }
        registration = await registerTranslationFeatures(new SelectionResolver(secrets), secrets);
        const document = await vscode.workspace.openTextDocument({ content: 'Hello\nUnrelated code', language: 'plaintext' });
        override(vscode.window, 'activeTextEditor', { document, selection: new vscode.Selection(0, 0, 0, 5) });
        override(vscode.window, 'showQuickPick', async () => ({ code: 'fr' }));
        let result = '';
        override(vscode.window, 'showTextDocument', async (output: vscode.TextDocument) => { result = output.getText(); });
        await commands.get('devlingo.translateSelection')!();
        assert.deepStrictEqual(requests, ['Hello']);
        assert.strictEqual(result, 'Bonjour');
        assert.strictEqual(document.getText(), 'Hello\nUnrelated code');
    });
    test('Missing credentials offer the existing configuration command', async () => {
        selected = 'openai';
        const executed: string[] = [];
        override(vscode.window, 'showErrorMessage', async (_message: string, action: string) => action);
        override(vscode.commands, 'executeCommand', async (id: string) => { executed.push(id); });
        registration = await registerTranslationFeatures(new OfflineResolver(secrets), secrets);
        assert.deepStrictEqual(executed, ['devlingo.configureProviderApiKey']);
    });
});
