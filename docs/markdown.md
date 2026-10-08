# Markdown translation

**Translate content, preserve structure.** DevLingo parses Markdown with CommonMark/GFM utilities, collects prose source offsets and substitutes translated fragments without serializing the whole document. Protected content is not sent to the provider by this workflow. This protection does not apply to manually selected text.

## What is translated or retained

| Content | Behavior |
| --- | --- |
| Headings, paragraphs, bold/italic/strikethrough | Translate prose; retain delimiters |
| Lists, task lists, blockquotes, GFM tables | Translate prose; retain structure and markers |
| Fenced/indented code and inline code | Keep unchanged |
| Explicit link labels | Translate labels; keep destinations and titles |
| Raw URLs and autolinks | Keep unchanged |
| Images and image references | Keep unchanged, including alt text |
| Reference definitions | Keep unchanged |
| Full reference-link labels | Translate labels; retain reference identifiers |
| Shortcut/collapsed reference links | Keep unchanged to avoid breaking references |
| Horizontal rules | Keep unchanged |
| Leading YAML frontmatter | Keep unchanged when opening/closing delimiters match |
| HTML nodes, comments and paired HTML regions | Protect content, including text inside |
| Existing escapes, entities, indentation and line endings | Retain source syntax |

## Example

Input:

````markdown
# Installation

Run `npm install devlingo`.

```bash
npm install devlingo
```

Read the [documentation](https://example.com).
````

Illustrative French output (not a captured provider response):

````markdown
# Installation

Exécutez `npm install devlingo`.

```bash
npm install devlingo
```

Consultez la [documentation](https://example.com).
````

The inline command `npm install devlingo`, fenced code and link destination `https://example.com` remain unchanged.

## File behavior

Open a saved local Markdown document and run **DevLingo: Translate Markdown File**. The target comes from `devlingo.targetLanguage`; `README.md` becomes `README.fr.md` for French, and `guide.md` becomes `guide.es.md` for Spanish. The command reads current editor content and writes a sibling file, keeping the source unchanged. Existing output offers **Replace** or **Cancel**; dirty output documents must be saved or closed before replacement. Safe file-writing logic guards against paths aliasing the source and output appearing during translation.

## Limits

- Only local `file:` documents are supported; save untitled files first.
- Prose is translated in fragments around markup and line boundaries, rather than as one whole document. This can reduce grammatical context or fluency across emphasis and links.
- Translation output is treated as prose: line breaks added by a provider are collapsed and Markdown metacharacters are escaped. Provider-generated formatting is not adopted.
- HTML protection is conservative; an unclosed HTML tag can protect the rest of the file. HTML text and image alt text are not translated.
- Frontmatter handling targets leading YAML `---` blocks; arbitrary frontmatter formats are not promised.
- GFM support is tested, but MDX, custom directives and every Markdown dialect are not guaranteed. Review output for your renderer and report minimal edge cases.
- Protected syntax stays in its source range, but provider quality is not guaranteed. Code identifiers written as plain prose may be translated; use inline code for content that must remain literal.

See [`markdownTextRanges.ts`](../src/markdown/markdownTextRanges.ts), [`markdownTranslator.ts`](../src/markdown/markdownTranslator.ts) and [architecture](architecture.md).
