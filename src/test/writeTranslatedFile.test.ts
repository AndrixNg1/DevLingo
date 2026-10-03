import * as assert from 'assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { writeTranslatedFile } from '../markdown/writeTranslatedFile';

suite('Atomic Markdown output', () => {
    let directory: string;
    setup(async () => { directory = await fs.mkdtemp(path.join(os.tmpdir(), 'devlingo-test-')); });
    teardown(async () => { await fs.rm(directory, { recursive: true, force: true }); });
    test('Creates a complete file and leaves no temporary artifacts', async () => {
        const target = path.join(directory, 'README.fr.md');
        await writeTranslatedFile(target, '# Translation\r\n', false);
        assert.strictEqual(await fs.readFile(target, 'utf8'), '# Translation\r\n');
        assert.deepStrictEqual(await fs.readdir(directory), ['README.fr.md']);
    });
    test('Refuses to overwrite an existing file without approval', async () => {
        const target = path.join(directory, 'README.fr.md');
        await fs.writeFile(target, 'Existing translation');
        await assert.rejects(writeTranslatedFile(target, 'New', false), { code: 'EEXIST' });
        assert.strictEqual(await fs.readFile(target, 'utf8'), 'Existing translation');
        assert.deepStrictEqual(await fs.readdir(directory), ['README.fr.md']);
    });
    test('Replaces the translation without changing the original, even when they were hard-linked', async () => {
        const original = path.join(directory, 'README.md');
        const target = path.join(directory, 'README.fr.md');
        await fs.writeFile(original, 'Original');
        await fs.link(original, target);
        await writeTranslatedFile(target, 'Translated', true);
        assert.strictEqual(await fs.readFile(original, 'utf8'), 'Original');
        assert.strictEqual(await fs.readFile(target, 'utf8'), 'Translated');
    });
    test('Handles concurrent creation without silently overwriting', async () => {
        const target = path.join(directory, 'README.fr.md');
        const results = await Promise.allSettled([
            writeTranslatedFile(target, 'one', false), writeTranslatedFile(target, 'two', false),
        ]);
        assert.strictEqual(results.filter(result => result.status === 'fulfilled').length, 1);
        assert.strictEqual(results.filter(result => result.status === 'rejected').length, 1);
        assert.deepStrictEqual(await fs.readdir(directory), ['README.fr.md']);
    });
    test('Cleans up if publication fails', async () => {
        const target = path.join(directory, 'folder.md');
        await fs.mkdir(target);
        await assert.rejects(writeTranslatedFile(target, 'Translated', true));
        assert.deepStrictEqual(await fs.readdir(directory), ['folder.md']);
    });
});
