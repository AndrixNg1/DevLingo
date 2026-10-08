import * as assert from 'assert';
import * as vscode from 'vscode';
import { SecretManager } from '../config/secrets';
import { ProviderResolver, ProviderNotConfiguredError } from '../translation/providers/providerResolver';
import { GoogleTranslationProvider } from '../translation/providers/googleTranslationProvider';
import { DeepLTranslationProvider } from '../translation/providers/deeplTranslationProvider';
import { OpenAITranslationProvider } from '../translation/providers/openaiTranslationProvider';
import { registerTranslationFeatures } from '../translation/registerTranslationFeatures';
import { FakeSecretStorage } from './helpers/fakeSecretStorage';

suite('Translation feature provider and credential lifetimes (offline)', function () {
    this.timeout(15000);
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
        selected = 'deepl'; calls = 0; hovers = []; commands = new Map(); notifications = [];
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
            if (!['google', 'deepl', 'openai'].includes(String(id))) {
                return super.resolve(id);
            }
            const cloudId = id === 'google' ? 'google' : id === 'deepl' ? 'deepl' : 'openai';
            const apiKey = await secrets.getApiKey(cloudId);
            if (!apiKey) {
                throw new ProviderNotConfiguredError(cloudId);
            }
            if (cloudId === 'google') {
                return new GoogleTranslationProvider({ apiKey }, { async translate() {
                    calls++;
                    return ['Bonjour Google'];
                } });
            }
            if (cloudId === 'deepl') {
                return new DeepLTranslationProvider({ apiKey }, { async translateText() {
                    calls++;
                    return { text: 'Bonjour DeepL' };
                } });
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
    test('Invalid and removed providers discard cached translations and recover after selecting DeepL', async () => {
        await secrets.setApiKey('deepl', 'test-api-key');
        registration = await registerTranslationFeatures(new OfflineResolver(secrets), secrets);
        const document = await vscode.workspace.openTextDocument({ content: '// Hello', language: 'typescript' });
        const cancellation = new vscode.CancellationTokenSource();
        const hover = () => hovers.at(-1)!.provideHover(document, new vscode.Position(0, 4), cancellation.token);
        try {
            assert.ok(await hover());
            for (const invalid of ['invalid-provider', 'mock']) {
                selected = invalid;
                let count = hovers.length;
                configEvents.fire({ affectsConfiguration: () => true });
                await settleRegistration(count);
                assert.strictEqual(await hover(), undefined);
                selected = 'deepl';
                count = hovers.length;
                configEvents.fire({ affectsConfiguration: () => true });
                await settleRegistration(count);
                assert.ok(await hover());
            }
            assert.strictEqual(calls, 3);
            assert.ok(notifications.some(message => message.includes('Unknown translation provider')));
        } finally {
            cancellation.dispose();
        }
    });
    test('Switching OpenAI to DeepL and back discards cached results from the previous provider', async () => {
        await secrets.setApiKey('openai', 'test-api-key');
        await secrets.setApiKey('deepl', 'test-other-key');
        selected = 'openai';
        registration = await registerTranslationFeatures(new OfflineResolver(secrets), secrets);
        const document = await vscode.workspace.openTextDocument({ content: '// Hello', language: 'typescript' });
        const cancellation = new vscode.CancellationTokenSource();
        const hoverText = async () => {
            const result = await hovers.at(-1)!.provideHover(document, new vscode.Position(0, 4), cancellation.token);
            return (result?.contents[0] as vscode.MarkdownString).value;
        };
        try {
            assert.ok(!(await hoverText()).includes('DeepL'));
            assert.strictEqual(calls, 1);
            selected = 'deepl';
            let count = hovers.length;
            configEvents.fire({ affectsConfiguration: () => true });
            await settleRegistration(count);
            assert.ok((await hoverText()).includes('DeepL'));
            await hoverText();
            assert.strictEqual(calls, 2);
            selected = 'openai'; count = hovers.length;
            configEvents.fire({ affectsConfiguration: () => true });
            await settleRegistration(count);
            assert.ok(!(await hoverText()).includes('DeepL'));
            assert.strictEqual(calls, 3);
        } finally {
            cancellation.dispose();
        }
    });
    for (const cloudId of ['openai', 'deepl', 'google'] as const) {
        test(`Refreshes ${cloudId} hover cache after saved, replaced and deleted keys`, async () => {
            selected = cloudId;
            registration = await registerTranslationFeatures(new OfflineResolver(secrets), secrets);
            const document = await vscode.workspace.openTextDocument({ content: '// Hello', language: 'typescript' });
            const cancellation = new vscode.CancellationTokenSource();
            const hoverText = async () => {
                const result = await hovers.at(-1)!.provideHover(document, new vscode.Position(0, 4), cancellation.token);
                return (result?.contents[0] as vscode.MarkdownString | undefined)?.value;
            };
            try {
                let count = hovers.length;
                assert.strictEqual(await hoverText(), undefined);
                assert.ok(notifications.some(message => message.includes('requires an API key')));
                await secrets.setApiKey(cloudId, 'test-api-key');
                count = hovers.length;
                secretEvents.fire({ key: `devlingo.provider.${cloudId}.apiKey` });
                await settleRegistration(count);
                assert.ok((await hoverText())?.includes('Bonjour'));
                assert.ok((await hoverText())?.includes('Bonjour'));
                assert.strictEqual(calls, 1);
                await secrets.setApiKey(cloudId, 'test-other-key');
                count = hovers.length;
                secretEvents.fire({ key: `devlingo.provider.${cloudId}.apiKey` });
                await settleRegistration(count);
                assert.ok((await hoverText())?.includes('Bonjour'));
                assert.strictEqual(calls, 2);
                await secrets.deleteApiKey(cloudId);
                count = hovers.length;
                secretEvents.fire({ key: `devlingo.provider.${cloudId}.apiKey` });
                await settleRegistration(count);
                assert.strictEqual(await hoverText(), undefined);
                await secrets.setApiKey(cloudId, 'test-restored-key');
                count = hovers.length;
                secretEvents.fire({ key: `devlingo.provider.${cloudId}.apiKey` });
                await settleRegistration(count);
                assert.ok((await hoverText())?.includes('Bonjour'));
                assert.strictEqual(calls, 3);
            } finally {
                cancellation.dispose();
            }
        });
    }
    for (const cloudId of ['openai', 'deepl', 'google'] as const) {
        test(`Selection uses ${cloudId} and sends only the selected text`, async () => {
            selected = cloudId; await secrets.setApiKey(cloudId, 'test-api-key');
            const requests: unknown[] = [];
            class SelectionResolver extends ProviderResolver {
                override async resolve() {
                    if (cloudId === 'google') {
                        return new GoogleTranslationProvider({ apiKey: 'test-api-key' }, { async translate(text) {
                            requests.push(text);
                            return ['Bonjour'];
                        } });
                    }
                    if (cloudId === 'deepl') {
                        return new DeepLTranslationProvider({ apiKey: 'test-api-key' }, { async translateText(text) {
                            requests.push(text);
                            return { text: 'Bonjour' };
                        } });
                    }
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
    }
    test('Later leaves the provider unchanged and never starts credential configuration', async () => {
        selected = 'openai';
        const executed: string[] = [];
        override(vscode.window, 'showErrorMessage', async (_message: string, ...actions: string[]) => {
            assert.deepStrictEqual(actions, ['Configure', 'Later']);
            return 'Later';
        });
        override(vscode.commands, 'executeCommand', async (id: string) => { executed.push(id); });
        registration = await registerTranslationFeatures(new OfflineResolver(secrets), secrets);
        assert.strictEqual(selected, 'openai');
        assert.deepStrictEqual(executed, []);
    });
    for (const cloudId of ['openai', 'deepl', 'google'] as const) {
        test(`${cloudId} missing credentials offer the existing configuration command`, async () => {
            selected = cloudId;
            const executed: [string, unknown][] = [];
            override(vscode.window, 'showErrorMessage', async (_message: string, action: string) => action);
            override(vscode.commands, 'executeCommand', async (id: string, providerId: unknown) => { executed.push([id, providerId]); });
            registration = await registerTranslationFeatures(new OfflineResolver(secrets), secrets);
            assert.deepStrictEqual(executed, [['devlingo.configureProviderApiKey', cloudId]]);
        });
    }
});
