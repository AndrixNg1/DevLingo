import * as assert from 'assert';
import { SecretManager, getProviderSecretKey } from '../config/secrets';
import { getCredentialProviders, type CredentialProviderId } from '../translation/providers/providerRegistry';
import { FakeSecretStorage } from './helpers/fakeSecretStorage';

suite('Provider SecretStorage manager', () => {
    test('Generates deterministic, distinct identifiers centrally', () => {
        for (const provider of getCredentialProviders()) {
            assert.strictEqual(getProviderSecretKey(provider.id), `devlingo.provider.${provider.id}.apiKey`);
        }
        assert.throws(() => getProviderSecretKey('mock' as CredentialProviderId), /does not support API credentials/);
        assert.throws(() => getProviderSecretKey('invalid' as CredentialProviderId), /does not support API credentials/);
    });
    test('Trims, retrieves, detects, replaces and deletes credentials through the injected store', async () => {
        const storage = new FakeSecretStorage();
        const secrets = new SecretManager(storage);
        assert.strictEqual(await secrets.getApiKey('google'), undefined);
        assert.strictEqual(await secrets.hasApiKey('google'), false);
        await secrets.setApiKey('google', '  test-api-key \n');
        assert.strictEqual(storage.values.get(getProviderSecretKey('google')), 'test-api-key');
        assert.strictEqual(await secrets.getApiKey('google'), 'test-api-key');
        assert.strictEqual(await secrets.hasApiKey('google'), true);
        await secrets.setApiKey('google', 'test-replacement');
        assert.strictEqual(await secrets.getApiKey('google'), 'test-replacement');
        await secrets.deleteApiKey('google');
        await secrets.deleteApiKey('google');
        assert.strictEqual(await secrets.hasApiKey('google'), false);
    });
    test('Isolates credentials by provider', async () => {
        const secrets = new SecretManager(new FakeSecretStorage());
        await secrets.setApiKey('google', 'test-google');
        await secrets.setApiKey('deepl', 'test-deepl');
        await secrets.deleteApiKey('google');
        assert.strictEqual(await secrets.getApiKey('deepl'), 'test-deepl');
        assert.strictEqual(await secrets.getApiKey('openai'), undefined);
    });
    test('Rejects empty keys without changing an existing value', async () => {
        const secrets = new SecretManager(new FakeSecretStorage());
        await secrets.setApiKey('openai', 'test-api-key');
        for (const input of ['', '  ', '\r\n\t']) {
            await assert.rejects(secrets.setApiKey('openai', input), /must not be empty/);
        }
        assert.strictEqual(await secrets.getApiKey('openai'), 'test-api-key');
    });
    test('Treats legacy whitespace-only stored values as absent', async () => {
        const storage = new FakeSecretStorage();
        storage.values.set(getProviderSecretKey('deepl'), '  ');
        assert.strictEqual(await new SecretManager(storage).hasApiKey('deepl'), false);
    });
    test('Sanitizes underlying storage failures instead of propagating secret values', async () => {
        const fail = async () => { throw new Error('test-api-key'); };
        const secrets = new SecretManager({ get: fail, store: fail, delete: fail });
        for (const operation of [
            () => secrets.getApiKey('google'), () => secrets.hasApiKey('google'),
            () => secrets.setApiKey('google', 'test-api-key'), () => secrets.deleteApiKey('google'),
        ]) {
            await assert.rejects(operation(), (error: unknown) => {
                assert.ok(error instanceof Error);
                assert.ok(!error.message.includes('test-api-key'));
                assert.ok(!error.stack?.includes('test-api-key'));
                return true;
            });
        }
    });
});
