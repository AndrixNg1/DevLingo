import * as assert from 'assert';
import * as vscode from 'vscode';
import { GoogleTranslationProvider, type GoogleTranslationClient } from '../translation/providers/googleTranslationProvider';
import { DeepLTranslationProvider } from '../translation/providers/deeplTranslationProvider';
import { OpenAITranslationProvider } from '../translation/providers/openaiTranslationProvider';
import { languages } from '../config/languages';
import { TranslationService } from '../translation/translationService';
import { TranslationCache } from '../translation/translationCache';
import { TranslationError } from '../translation/translationError';
import { MarkdownTranslator } from '../markdown/markdownTranslator';
import { CommentTranslationHover } from '../hover/commentTranslationHover';

suite('Google Translation Basic v2 provider (offline)', () => {
    let requests: Parameters<GoogleTranslationClient['translate']>[];
    let output: string;
    let failure: unknown;
    let provider: GoogleTranslationProvider;
    setup(() => {
        requests = []; output = 'Bonjour Google'; failure = undefined;
        provider = new GoogleTranslationProvider({ apiKey: 'test-api-key' }, { async translate(...args) {
            requests.push(args);
            if (failure) {
                throw failure;
            }
            return [output, {}];
        } });
    });
    test('Preserves empty input without requests', async () => {
        for (const text of ['', ' ', '\t\r\n']) {
            assert.strictEqual(await provider.translate(text, { targetLanguage: 'fr' }), text);
        }
        assert.strictEqual(requests.length, 0);
    });
    test('Calls plain-text translation once and extracts the first tuple value', async () => {
        assert.strictEqual(await provider.translate('Hello', { targetLanguage: 'fr' }), 'Bonjour Google');
        assert.deepStrictEqual(requests, [['Hello', { to: 'fr', format: 'text' }]]);
        assert.ok(!JSON.stringify(requests).includes('test-api-key'));
    });
    test('Forwards targets from the centralized registry without provider variants', async () => {
        for (const language of languages) {
            await provider.translate('Hello', { targetLanguage: language.code });
            assert.strictEqual(requests.at(-1)?.[1].to, language.code);
        }
    });
    test('Omits source for undefined, empty and auto; never makes a detection request', async () => {
        for (const sourceLanguage of [undefined, '', '  ', 'auto', ' AUTO ']) {
            await provider.translate('Hello', { targetLanguage: 'fr', sourceLanguage });
            assert.ok(!Object.hasOwn(requests.at(-1)![1], 'from'));
        }
        assert.strictEqual(requests.length, 5);
    });
    test('Includes a concrete source language and normalizes codes', async () => {
        await provider.translate('Hello', { targetLanguage: ' FR ', sourceLanguage: ' EN ' });
        assert.deepStrictEqual(requests, [['Hello', { to: 'fr', format: 'text', from: 'en' }]]);
        await provider.translate('Ciao', { targetLanguage: 'fr', sourceLanguage: 'it' });
        assert.strictEqual(requests.at(-1)?.[1].from, 'it');
    });
    test('Rejects invalid language configuration before a request', async () => {
        await assert.rejects(provider.translate('Hello', { targetLanguage: 'xx' }), /target language is not supported/);
        await assert.rejects(provider.translate('Hello', { targetLanguage: 'fr', sourceLanguage: 'not a language' }), /source language is not supported/);
        assert.strictEqual(requests.length, 0);
    });
    test('Preserves returned whitespace and rejects empty responses', async () => {
        output = '\tBonjour\nGoogle  \r\n';
        assert.strictEqual(await provider.translate('Hello', { targetLanguage: 'fr' }), output);
        for (const empty of ['', '\r\n ']) {
            output = empty;
            await assert.rejects(provider.translate('Hello', { targetLanguage: 'fr' }), /empty translation/);
        }
    });
    test('Rejects blank credentials before constructing the SDK', () => {
        assert.throws(() => new GoogleTranslationProvider({ apiKey: '  ' }), /requires an API key/);
    });
    const cases: [string, unknown, string][] = [
        ['invalid key', { code: 400, errors: [{ reason: 'keyInvalid' }] }, 'authentication failed'],
        ['authentication', { code: 401 }, 'authentication failed'],
        ['API disabled', { code: 403, errors: [{ reason: 'accessNotConfigured' }] }, 'not configured correctly'],
        ['billing', { code: 403, details: [{ reason: 'BILLING_DISABLED' }] }, 'billing'],
        ['restricted key', { code: 403, details: [{ reason: 'API_KEY_SERVICE_BLOCKED' }] }, 'key restrictions'],
        ['quota', { code: 403, errors: [{ reason: 'dailyLimitExceeded' }] }, 'quota exceeded'],
        ['structured quota', { code: 429, details: [{ reason: 'QUOTA_EXCEEDED' }] }, 'quota exceeded'],
        ['rate limit', { code: 429 }, 'rate limit reached'],
        ['legacy rate limit', { code: 403, errors: [{ reason: 'userRateLimitExceeded' }] }, 'rate limit reached'],
        ['network DNS', { code: 'ENOTFOUND' }, 'Unable to reach'],
        ['connection', { code: 'ECONNRESET' }, 'Unable to reach'],
        ['timeout', { code: 'ETIMEDOUT' }, 'Unable to reach'],
        ['service', { code: 503 }, 'API is unavailable'],
        ['invalid language', { code: 400 }, 'language or request'],
        ['access denied', { code: 403 }, 'access denied'],
        ['nested reason', { response: { status: 400, data: { error: { details: [{ reason: 'API_KEY_INVALID' }] } } } }, 'authentication failed'],
        ['SDK response body', { response: { statusCode: 400, body: JSON.stringify({ error: { details: [{ reason: 'API_KEY_INVALID' }] } }) } }, 'authentication failed'],
        ['malformed body', { code: 503, response: { body: 'test-api-key' } }, 'API is unavailable'],
        ['unexpected SDK', {}, 'Translation failed'],
    ];
    for (const [name, details, message] of cases) {
        test(`Maps ${name} errors without SDK details or credentials`, async () => {
            failure = Object.assign(new Error('test-api-key'), details);
            await assert.rejects(provider.translate('Hello', { targetLanguage: 'fr' }), (error: unknown) => {
                assert.ok(error instanceof TranslationError);
                assert.ok(error.message.includes(message));
                assert.ok(!error.message.includes('test-api-key'));
                assert.strictEqual(error.cause, undefined);
                return true;
            });
        });
    }
    test('Caches Google separately from OpenAI and DeepL and reuses duplicate requests', async () => {
        const googleCache = new TranslationCache(new TranslationService(provider, 'google'));
        const openAI = new OpenAITranslationProvider({ apiKey: 'test-api-key' }, { responses: { async create() { return { output_text: 'Bonjour OpenAI' }; } } });
        const deepL = new DeepLTranslationProvider({ apiKey: 'test-api-key' }, { async translateText() { return { text: 'Bonjour DeepL' }; } });
        const openAICache = new TranslationCache(new TranslationService(openAI, 'openai'));
        const deepLCache = new TranslationCache(new TranslationService(deepL, 'deepl'));
        const first = googleCache.translate('Hello', 'fr', 'en');
        assert.strictEqual(googleCache.translate('Hello', 'fr', 'en'), first);
        assert.strictEqual(await first, 'Bonjour Google');
        assert.strictEqual(await openAICache.translate('Hello', 'fr', 'en'), 'Bonjour OpenAI');
        assert.strictEqual(await deepLCache.translate('Hello', 'fr', 'en'), 'Bonjour DeepL');
        assert.strictEqual(await googleCache.translate('Hello', 'fr', 'en'), 'Bonjour Google');
        assert.strictEqual(requests.length, 1);
    });
    test('Markdown sends only prose and protects code, URLs, images, frontmatter and HTML', async () => {
        const translator = new MarkdownTranslator(new TranslationService(provider, 'google'));
        const markdown = '---\ntitle: Protected\n---\n# Hello\n\nHello `identifier` [Hello](https://example.com)\n\n![Protected](image.png)\n\n```ts\nconst user = 1;\n```\n\n<!-- Protected -->\n';
        const translated = await translator.translateMarkdown(markdown, 'fr');
        assert.ok(translated.startsWith('---\ntitle: Protected\n---\n# Bonjour Google'));
        for (const protectedText of ['`identifier`', '(https://example.com)', '![Protected](image.png)', '```ts\nconst user = 1;\n```', '<!-- Protected -->']) {
            assert.ok(translated.includes(protectedText));
        }
        assert.deepStrictEqual(requests.map(request => request[0]), ['Hello']);
    });
    test('Hover sends only the comment, shares requests and leaves source unchanged', async () => {
        const hover = new CommentTranslationHover(new TranslationService(provider, 'google'));
        const document = await vscode.workspace.openTextDocument({ content: '// Hello\nconst user = 1;', language: 'typescript' });
        const cancellation = new vscode.CancellationTokenSource();
        try {
            const result = await hover.provideHover(document, new vscode.Position(0, 4), cancellation.token);
            const expected = new vscode.MarkdownString('**DevLingo**\n\n🌐 ');
            expected.appendText('Bonjour Google');
            assert.strictEqual((result?.contents[0] as vscode.MarkdownString).value, expected.value);
            await hover.provideHover(document, new vscode.Position(0, 5), cancellation.token);
            assert.deepStrictEqual(requests.map(request => request[0]), ['Hello']);
            assert.strictEqual(document.getText(), '// Hello\nconst user = 1;');
        } finally {
            cancellation.dispose();
        }
    });
});
