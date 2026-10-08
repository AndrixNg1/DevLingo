import * as assert from 'assert';
import * as vscode from 'vscode';
import { configureProviderApiKey, removeProviderApiKey, changeTranslationProvider } from '../commands/providerCommands';
import { SecretManager, getProviderSecretKey } from '../config/secrets';
import { getTranslationProvider, setTranslationProvider } from '../config/settings';
import { getAvailableProviders, getCredentialProviders, type TranslationProviderId } from '../translation/providers/providerRegistry';
import { FakeSecretStorage } from './helpers/fakeSecretStorage';

suite('Provider commands and settings', function () {
    this.timeout(15000);
    let storage: FakeSecretStorage;
    let secrets: SecretManager;
    let info: string[];
    let errors: string[];
    let choices: readonly { label: string; description?: string }[];
    let choose: string | undefined;
    let input: string | undefined;
    let inputOptions: vscode.InputBoxOptions | undefined;
    let savedProvider: unknown;
    const restorations: (() => void)[] = [];
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
    setup(async () => {
        storage = new FakeSecretStorage(); secrets = new SecretManager(storage);
        info = []; errors = []; choices = []; choose = undefined; input = undefined; inputOptions = undefined;
        savedProvider = vscode.workspace.getConfiguration('devlingo').inspect('translationProvider')?.globalValue;
        override(vscode.window, 'showInformationMessage', async (message: string) => { info.push(message); });
        override(vscode.window, 'showErrorMessage', async (message: string) => { errors.push(message); });
        override(vscode.window, 'showQuickPick', async (items: { label: string; description?: string }[]) => {
            choices = items;
            return items.find(item => item.label === choose);
        });
        override(vscode.window, 'showInputBox', async (options: vscode.InputBoxOptions) => { inputOptions = options; return input; });
        await setTranslationProvider('deepl');
    });
    teardown(async () => {
        await vscode.workspace.getConfiguration('devlingo').update('translationProvider', savedProvider, vscode.ConfigurationTarget.Global);
        while (restorations.length) {
            restorations.pop()!();
        }
    });

    test('Registers all provider commands and contributes only implemented providers to settings', async () => {
        const extension = vscode.extensions.all.find(item => item.packageJSON.name === 'devlingo');
        assert.ok(extension);
        await extension.activate();
        const commands = await vscode.commands.getCommands(true);
        for (const id of ['configureProviderApiKey', 'removeProviderApiKey', 'changeTranslationProvider']) {
            assert.ok(commands.includes(`devlingo.${id}`));
        }
        const properties = extension.packageJSON.contributes.configuration.properties;
        assert.strictEqual(properties['devlingo.translationProvider'].default, 'deepl');
        assert.deepStrictEqual(properties['devlingo.translationProvider'].enum, getAvailableProviders().map(provider => provider.id));
        assert.strictEqual(properties['devlingo.translationProvider'].scope, 'application');
        assert.ok(Object.keys(properties).every(key => !/apiKey|credential|secret/i.test(key)));
    });
    test('Configures only cloud credentials using a masked input without revealing the key', async () => {
        choose = 'Google Cloud Translation'; input = ' test-api-key ';
        await configureProviderApiKey(secrets);
        assert.deepStrictEqual(choices.map(item => item.label), getCredentialProviders().map(provider => provider.displayName));
        assert.ok(choices.find(item => item.label === 'Google Cloud Translation')?.description?.includes('Basic v2'));
        assert.ok(choices.find(item => item.label === 'OpenAI')?.description?.includes('OpenAI API key'));
        assert.strictEqual(inputOptions?.password, true);
        assert.strictEqual(inputOptions?.ignoreFocusOut, true);
        assert.ok(!inputOptions?.prompt?.includes('not active'));
        assert.strictEqual(inputOptions?.value, undefined);
        assert.ok(inputOptions?.validateInput?.('  '));
        assert.strictEqual(inputOptions?.validateInput?.('test-api-key'), undefined);
        assert.strictEqual(storage.values.get(getProviderSecretKey('google')), 'test-api-key');
        assert.ok(info[0].includes('credentials saved'));
        assert.ok(!info.join(' ').includes('test-api-key'));
        assert.strictEqual(getTranslationProvider(), 'deepl');
    });
    test('Configures DeepL credentials through the existing secure command', async () => {
        choose = 'DeepL'; input = ' test-api-key ';
        await configureProviderApiKey(secrets);
        assert.strictEqual(inputOptions?.password, true);
        assert.strictEqual(inputOptions?.value, undefined);
        assert.ok(!inputOptions?.prompt?.includes('not active'));
        assert.strictEqual(storage.values.get(getProviderSecretKey('deepl')), 'test-api-key');
        assert.ok(!info.join(' ').includes('test-api-key'));
        assert.ok(!info.join(' ').includes('not available'));
    });
    test('Cancellation leaves existing credentials intact', async () => {
        await secrets.setApiKey('deepl', 'test-api-key');
        await configureProviderApiKey(secrets);
        assert.strictEqual(inputOptions, undefined);
        choose = 'DeepL'; input = undefined;
        await configureProviderApiKey(secrets);
        assert.strictEqual(await secrets.getApiKey('deepl'), 'test-api-key');
        assert.strictEqual(info.length, 0);
    });
    test('Rejects blank credentials without storing or displaying them', async () => {
        choose = 'OpenAI'; input = '  ';
        await configureProviderApiKey(secrets);
        assert.strictEqual(storage.values.size, 0);
        assert.ok(errors.some(message => message.includes('Unable to save')));
    });
    test('Removes only configured credentials, without showing their values', async () => {
        await secrets.setApiKey('google', 'test-api-key');
        await secrets.setApiKey('deepl', 'test-other-key');
        choose = 'Google Cloud Translation';
        await removeProviderApiKey(secrets);
        assert.deepStrictEqual(choices.map(item => item.label), ['Google Cloud Translation', 'DeepL']);
        assert.ok(!JSON.stringify(choices).includes('test-api-key'));
        assert.strictEqual(await secrets.hasApiKey('google'), false);
        assert.strictEqual(await secrets.hasApiKey('deepl'), true);
        assert.ok(info[0].includes('credentials removed'));
    });
    test('Safely handles removal when no credential exists or the picker is cancelled', async () => {
        await removeProviderApiKey(secrets);
        assert.ok(info[0].includes('No provider credentials'));
        assert.deepStrictEqual(choices, []);
        await secrets.setApiKey('openai', 'test-api-key');
        await removeProviderApiKey(secrets);
        assert.strictEqual(await secrets.hasApiKey('openai'), true);
    });
    test('Reports storage failures without exposing the original exception', async () => {
        const fail = async () => { throw new Error('test-api-key'); };
        const broken = new SecretManager({ get: fail, store: fail, delete: fail });
        choose = 'DeepL'; input = 'test-api-key';
        await configureProviderApiKey(broken);
        await removeProviderApiKey(broken);
        assert.strictEqual(errors.length, 2);
        assert.ok(errors.every(message => !message.includes('test-api-key')));
    });
    test('Only allows selection of available providers and keeps cancellation safe', async () => {
        await changeTranslationProvider();
        assert.deepStrictEqual(choices.map(item => item.label), ['Google Cloud Translation', 'DeepL', 'OpenAI']);
        assert.strictEqual(info.length, 0);
        choose = 'DeepL';
        await changeTranslationProvider();
        assert.strictEqual(getTranslationProvider(), 'deepl');
        assert.ok(info[0].includes('selected'));
    });
    test('Rejects unavailable/unknown provider configuration without changing the setting', async () => {
        for (const id of ['unknown', '__proto__']) {
            await assert.rejects(setTranslationProvider(id as TranslationProviderId), /not available/);
            assert.strictEqual(getTranslationProvider(), 'deepl');
        }
    });
    test('Does not silently substitute a provider for a manually configured invalid values', async () => {
        await vscode.workspace.getConfiguration('devlingo').update('translationProvider', 'invalid-provider', vscode.ConfigurationTarget.Global);
        assert.strictEqual(getTranslationProvider(), 'invalid-provider');
        await vscode.workspace.getConfiguration('devlingo').update('translationProvider', 'unknown', vscode.ConfigurationTarget.Global);
        assert.strictEqual(getTranslationProvider(), 'unknown');
    });
    test('Rejects the removed provider instead of silently selecting a cloud provider', async () => {
        await assert.rejects(setTranslationProvider('mock' as TranslationProviderId), /not available/);
        assert.strictEqual(getTranslationProvider(), 'deepl');
    });
});
