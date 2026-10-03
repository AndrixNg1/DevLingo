import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/** Publishes a completed sibling temporary file; exclusive creation also handles races. */
export async function writeTranslatedFile(target: string, content: string, replace: boolean): Promise<void> {
    const directory = await fs.mkdtemp(path.join(path.dirname(target), '.devlingo-'));
    const temporary = path.join(directory, 'translation.md');
    try {
        await fs.writeFile(temporary, content, 'utf8');
        if (replace) {
            await fs.rename(temporary, target);
        } else {
            await fs.link(temporary, target);
        }
    } finally {
        await fs.rm(directory, { recursive: true, force: true });
    }
}
