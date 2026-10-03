export const commentLanguageIds = [
    'javascript', 'javascriptreact', 'typescript', 'typescriptreact', 'vue', 'php',
    'css', 'scss', 'less', 'python', 'shellscript', 'html',
] as const;

export interface ExtractedComment {
    text: string;
    start: number;
    end: number;
}

type Syntax = 'markup' | 'script' | 'style' | 'scss' | 'php' | 'python' | 'shell';

/** A conservative lexical scan: strings are skipped before looking for comments. */
export function extractComment(source: string, offset: number, languageId: string): ExtractedComment | undefined {
    if (!commentLanguageIds.some(id => id === languageId) || offset < 0 || offset >= source.length) {
        return undefined;
    }
    const markup = languageId === 'html' || languageId === 'vue' || languageId === 'php';
    let syntax: Syntax = markup ? 'markup'
        : languageId === 'python' ? 'python'
        : languageId === 'shellscript' ? 'shell'
        : languageId === 'css' ? 'style'
        : languageId === 'scss' || languageId === 'less' ? 'scss' : 'script';
    let closingTag: string | undefined;
    const react = languageId === 'javascriptreact' || languageId === 'typescriptreact';
    let jsxDepth = 0;
    let jsxText = false;
    let expressionDepth = 0;
    let index = 0;
    while (index <= offset && index < source.length) {
        const start = index;
        let opener: string | undefined;
        let closer: string | undefined;
        if (syntax === 'markup') {
            if (source.startsWith('<!--', index)) {
                opener = '<!--';
                closer = '-->';
            } else if (languageId === 'php' && /^<\?(?:php\b|=)/i.test(source.slice(index))) {
                index += source.startsWith('<?=', index) ? 3 : 5;
                syntax = 'php';
                continue;
            } else if (source[index] === '<') {
                // Consume complete tags, including quoted attributes.
                const tag = /^<(script|style)\b/i.exec(source.slice(index));
                index++;
                while (index < source.length && source[index] !== '>') {
                    if (source[index] === '"' || source[index] === "'") {
                        index = skipString(source, index, false);
                    } else {
                        index++;
                    }
                }
                index++;
                if (tag) {
                    syntax = tag[1].toLowerCase() === 'script' ? 'script'
                        : /\blang\s*=\s*['"](?:scss|less)['"]/i.test(source.slice(start, index)) ? 'scss' : 'style';
                    closingTag = tag[1].toLowerCase();
                } else {
                    const rawText = /^<(textarea|title)\b/i.exec(source.slice(start));
                    if (rawText) {
                        const end = source.toLowerCase().indexOf(`</${rawText[1].toLowerCase()}`, index);
                        index = end === -1 ? source.length : end;
                    }
                }
                continue;
            } else {
                index++;
                continue;
            }
        } else {
            // JSX text and tag attributes are not JavaScript comments.
            if (react && source[index] === '<' && (jsxText || canStartRegex(source.slice(0, index)))
                && /^<\/?(?:[A-Za-z][\w.:/-]*\b|>)/.test(source.slice(index))) {
                const closing = source[index + 1] === '/';
                index++;
                while (index < source.length && source[index] !== '>') {
                    if (source[index] === '"' || source[index] === "'") {
                        index = skipString(source, index, false);
                    } else {
                        index++;
                    }
                }
                jsxDepth += closing ? -1 : source[index - 1] === '/' ? 0 : 1;
                jsxText = jsxDepth > 0;
                index++;
                continue;
            }
            if (jsxText) {
                if (source[index] === '{') {
                    jsxText = false;
                    expressionDepth = 1;
                }
                index++;
                continue;
            }
            if (closingTag && source.slice(index).toLowerCase().startsWith(`</${closingTag}`)) {
                syntax = 'markup';
                closingTag = undefined;
                continue;
            }
            if (syntax === 'php' && source.startsWith('?>', index)) {
                syntax = 'markup';
                index += 2;
                continue;
            }
            const char = source[index];
            if (react && expressionDepth > 0 && (char === '{' || char === '}')) {
                expressionDepth += char === '{' ? 1 : -1;
                jsxText = expressionDepth === 0 && jsxDepth > 0;
                index++;
                continue;
            }
            if ((syntax === 'shell' || syntax === 'php') && source.startsWith('<<', index)) {
                const end = skipHeredoc(source, index, syntax === 'php');
                if (end !== undefined) {
                    index = end;
                    continue;
                }
            }
            if (char === '"' || char === "'" || (char === '`' && syntax !== 'python')) {
                index = skipString(source, index, syntax === 'python');
                continue;
            }
            // Regex literals may contain apparent // or /* delimiters.
            if (syntax === 'script' && char === '/' && !source.startsWith('//', index)
                && !source.startsWith('/*', index) && canStartRegex(source.slice(0, index))) {
                index = skipRegex(source, index);
                continue;
            }
            if ((syntax === 'python' || syntax === 'shell' || syntax === 'php') && char === '#'
                && !(syntax === 'php' && source.startsWith('#[', index))
                && (syntax !== 'shell' || index === 0 || /[\s;|&()]/.test(source[index - 1]))) {
                opener = '#';
            } else if (['script', 'scss', 'php'].includes(syntax) && source.startsWith('//', index)) {
                opener = '//';
            } else if (['script', 'style', 'scss', 'php'].includes(syntax) && source.startsWith('/*', index)) {
                opener = '/*';
                closer = '*/';
            } else {
                // Escaped shell characters do not begin comments.
                index += syntax === 'shell' && char === '\\' ? 2 : 1;
                continue;
            }
        }
        const contentStart = start + opener.length;
        const close = closer ? source.indexOf(closer, contentStart) : source.indexOf('\n', contentStart);
        const contentEnd = close === -1 ? source.length : close;
        const end = contentEnd + (closer && close !== -1 ? closer.length : 0);
        if (offset >= start && offset < end) {
            const text = source.slice(contentStart, contentEnd)
                .split('\n').map(line => closer === '*/' ? line.replace(/^\s*\*(?:\s|$)/, '') : line)
                .join('\n').trim();
            const delimitersOnly = (opener === '/*' || opener === '//') && /^[*/\s]*$/.test(text);
            return text && !delimitersOnly ? { text, start, end } : undefined;
        }
        index = end;
    }
    return undefined;
}

function skipString(source: string, start: number, python: boolean): number {
    const quote = source[start];
    const delimiter = python && source.startsWith(quote.repeat(3), start) ? quote.repeat(3) : quote;
    let index = start + delimiter.length;
    while (index < source.length) {
        if (source[index] === '\\') {
            index += 2;
        } else if (source.startsWith(delimiter, index)) {
            return index + delimiter.length;
        } else {
            index++;
        }
    }
    return index;
}

function canStartRegex(prefix: string): boolean {
    return /(?:^|=>|[=(:,!&|?{};\[]|\b(?:return|throw|case|yield))\s*$/.test(prefix)
        || /\b(?:if|while|for|with)\s*\([^)]*\)\s*$/.test(prefix);
}

function skipHeredoc(source: string, start: number, php: boolean): number | undefined {
    const header = (php ? /^<<<\s*['"]?(\w+)['"]?/ : /^<<(-?)\s*['"]?(\w+)['"]?/).exec(source.slice(start));
    if (!header) {
        return undefined;
    }
    const delimiter = header[php ? 1 : 2];
    let index = source.indexOf('\n', start);
    while (index !== -1 && index < source.length) {
        const next = source.indexOf('\n', index + 1);
        const line = source.slice(index + 1, next === -1 ? source.length : next);
        const normalized = php ? line.trim().replace(/;$/, '') : header[1] === '-' ? line.replace(/^\t+/, '') : line;
        if (normalized === delimiter) {
            return next === -1 ? source.length : next + 1;
        }
        index = next;
    }
    return source.length;
}

function skipRegex(source: string, start: number): number {
    let inClass = false;
    for (let index = start + 1; index < source.length; index++) {
        if (source[index] === '\\') {
            index++;
        } else if (source[index] === '[') {
            inClass = true;
        } else if (source[index] === ']') {
            inClass = false;
        } else if (source[index] === '/' && !inClass) {
            return index + 1;
        } else if (source[index] === '\n') {
            return index;
        }
    }
    return source.length;
}
