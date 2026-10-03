import type { Nodes } from 'mdast';

export interface TextRange { start: number; end: number }

/** Parser offsets let us edit prose without serializing or reformatting Markdown. */
export async function getTranslatableRanges(content: string): Promise<TextRange[]> {
    const [{ fromMarkdown }, { gfmFromMarkdown }, { gfm }] = await Promise.all([
        import('mdast-util-from-markdown'), import('mdast-util-gfm'), import('micromark-extension-gfm'),
    ]);
    const tree = fromMarkdown(content, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] });
    const protectedRanges = collectProtectedRanges(content, tree);
    const textRanges: TextRange[] = [];
    collectTextRanges(tree, content, textRanges);
    return textRanges.flatMap(range => proseSegments(content, range, protectedRanges));
}

function proseSegments(content: string, range: TextRange, protectedRanges: TextRange[]): TextRange[] {
    const result: TextRange[] = [];
    // Preserve CRLF, indentation, hard breaks and multiline blockquote prefixes.
    for (const match of content.slice(range.start, range.end).matchAll(/[^\r\n]+/g)) {
        const start = range.start + match.index;
        const line = match[0];
        const leading = /^(?:[\t ]|> ?)+/.exec(line)?.[0].length ?? 0;
        const trailing = /[\t ]*$/.exec(line)![0].length;
        const from = start + leading;
        const to = start + line.length - trailing;
        if (from >= to || protectedRanges.some(protectedRange => from < protectedRange.end && to > protectedRange.start)) {
            continue;
        }
        // Escapes and entities are source syntax, not text to send to the provider.
        const fragments = /\\[!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~]|&(?:#\d+|#x[\da-f]+|[a-z][\da-z]+);/gi;
        let segmentStart = from;
        for (const fragment of content.slice(from, to).matchAll(fragments)) {
            addSegment(segmentStart, from + fragment.index);
            segmentStart = from + fragment.index + fragment[0].length;
        }
        addSegment(segmentStart, to);
    }
    return result;

    function addSegment(start: number, end: number): void {
        const text = content.slice(start, end);
        const trimmed = text.trim();
        if (/[\p{L}\p{N}]/u.test(trimmed)) {
            const begin = start + text.indexOf(trimmed);
            result.push({ start: begin, end: begin + trimmed.length });
        }
    }
}

function collectTextRanges(node: Nodes, content: string, ranges: TextRange[]): void {
    if (node.type === 'link' && !content.slice(node.position?.start.offset, node.position?.end.offset).startsWith('[')) {
        return; // Automatic links and raw URLs have no translatable label.
    }
    if (node.type === 'linkReference' && node.referenceType !== 'full') {
        return; // Changing a shortcut/collapsed label would break its reference.
    }
    if (node.type === 'text' && node.position?.start.offset !== undefined && node.position.end.offset !== undefined) {
        ranges.push({ start: node.position.start.offset, end: node.position.end.offset });
    } else if ('children' in node) {
        for (const child of node.children) {
            collectTextRanges(child, content, ranges);
        }
    }
}

function collectProtectedRanges(content: string, tree: Nodes): TextRange[] {
    const ranges: TextRange[] = [];
    // A paired delimiter at the beginning denotes frontmatter; a lone --- remains a rule.
    const frontmatter = /^\uFEFF?---[\t ]*\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)[\t ]*(?:\r?\n|$)/.exec(content);
    if (frontmatter) {
        ranges.push({ start: 0, end: frontmatter[0].length });
    }
    const collect = (node: Nodes): void => {
        if (['code', 'inlineCode', 'image', 'imageReference', 'definition', 'html'].includes(node.type)
            && node.position?.start.offset !== undefined && node.position.end.offset !== undefined) {
            ranges.push({ start: node.position.start.offset, end: node.position.end.offset });
        }
        if ('children' in node) {
            node.children.forEach(collect);
        }
    };
    collect(tree);
    // Extend HTML protection across blank lines, where CommonMark ends its HTML node.
    const tags = /<!--[\s\S]*?(?:-->|$)|<\/?([A-Za-z][\w-]*(?::[A-Za-z][\w-]*)?)(?=[\s/>])(?:"[^"]*"|'[^']*'|[^'">])*>/g;
    const stack: { name: string; start: number }[] = [];
    for (const match of content.matchAll(tags)) {
        const start = match.index;
        if (ranges.some(range => start >= range.start && start < range.end && !content.slice(range.start, range.end).startsWith('<'))) {
            continue;
        }
        const name = match[1]?.toLowerCase();
        if (!name) {
            ranges.push({ start, end: start + match[0].length });
        } else if (match[0].startsWith('</')) {
            let opening = stack.length - 1;
            while (opening >= 0 && stack[opening].name !== name) {
                opening--;
            }
            if (opening !== -1) {
                ranges.push({ start: stack[opening].start, end: start + match[0].length });
                stack.splice(opening);
            }
        } else if (!/\/>$/.test(match[0]) && !['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'].includes(name)) {
            stack.push({ name, start });
        }
    }
    for (const tag of stack) {
        ranges.push({ start: tag.start, end: content.length });
    }
    return ranges;
}

