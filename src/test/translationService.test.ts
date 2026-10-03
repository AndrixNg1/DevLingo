import * as assert from 'assert';
import { TranslationService } from '../translation/translationService';
import type { TranslationOptions } from '../translation/types';

suite('TranslationService', () => {
    test('Delegates original text and options and returns the provider result', async () => {
        const options: TranslationOptions = { targetLanguage: 'fr', sourceLanguage: 'en' };
        const service = new TranslationService({
            async translate(text, receivedOptions) {
                assert.strictEqual(text, ' Hello\nworld ');
                assert.strictEqual(receivedOptions, options);
                return 'Bonjour';
            },
        });
        assert.strictEqual(await service.translate(' Hello\nworld ', options), 'Bonjour');
    });

    for (const text of ['', ' ', '\t\r\n  ']) {
        test(`Preserves blank input ${JSON.stringify(text)} without calling the provider`, async () => {
            const service = new TranslationService({
                async translate() {
                    assert.fail('Provider must not be called');
                },
            });
            assert.strictEqual(await service.translate(text, { targetLanguage: 'fr' }), text);
        });
    }

    test('Propagates provider failures', async () => {
        const error = new Error('Translation failed');
        const service = new TranslationService({ async translate() { throw error; } });
        await assert.rejects(service.translate('Hello', { targetLanguage: 'fr' }), error);
    });
});
