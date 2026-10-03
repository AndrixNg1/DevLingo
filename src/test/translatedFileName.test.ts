import * as assert from 'assert';
import { translatedFileName } from '../markdown/translatedFileName';

suite('Translated Markdown filename', () => {
    for (const input of ['README.md', 'CONTRIBUTING.md', 'guide.md', 'docs/getting-started.md', '/tmp/docs/guide.md', 'README.en.md']) {
        test(`Appends a language suffix to ${input}`, () => {
            assert.strictEqual(translatedFileName(input, 'fr'), input.slice(0, -3) + '.fr.md');
        });
    }
    test('Handles uppercase and long extensions and Markdown documents with other extensions', () => {
        assert.strictEqual(translatedFileName('GUIDE.MD', 'de'), 'GUIDE.de.md');
        assert.strictEqual(translatedFileName('guide.markdown', 'es'), 'guide.es.md');
        assert.strictEqual(translatedFileName('notes.txt', 'fr'), 'notes.txt.fr.md');
    });
    test('Rejects invalid language suffixes to prevent path traversal', () => {
        for (const language of ['', '../file', 'fr/elsewhere', 'fr\\elsewhere']) {
            assert.throws(() => translatedFileName('README.md', language), /Invalid target language/);
        }
    });
});
