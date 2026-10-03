import * as assert from 'assert';
import { MockTranslationProvider } from '../translation/providers/mockTranslationProvider';
import { languages } from '../config/languages';

suite('MockTranslationProvider', () => {
    for (const { code } of languages) {
        test(`Prefixes text with target language ${code}`, async () => {
            const provider = new MockTranslationProvider();
            assert.strictEqual(await provider.translate('Hello world', { targetLanguage: code }), `[${code}] Hello world`);
        });
    }

    test('Preserves formatting and accepts an optional source language', async () => {
        const provider = new MockTranslationProvider();
        assert.strictEqual(
            await provider.translate(' Hello\nworld\t', { targetLanguage: 'fr', sourceLanguage: 'en' }),
            '[fr]  Hello\nworld\t',
        );
    });
});
