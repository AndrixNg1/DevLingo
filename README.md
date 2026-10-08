# DevLingo

DevLingo is a VS Code extension designed to make multilingual development workflows easier by translating Markdown documentation and code comments directly inside the editor.

## Features

### Markdown Translation

Translate Markdown files without leaving VS Code while preserving their structure and developer-specific content.

DevLingo aims to preserve:

- Headings
- Lists
- Links
- Inline code
- Code blocks
- Markdown formatting

### Comment Translation

Translate code comments directly from the editor using hover information without modifying the source file.

```ts
// Fetch the currently authenticated user
const user = await getCurrentUser();
```

Hovering over the comment can display its translation directly inside VS Code.

## Native command center

Click the **globe icon** in the editor title toolbar, or run **DevLingo: Open** from the Command Palette. This opens a native QuickPick; opening it never translates automatically. The built-in Codicon follows VS Code themes. The action is contributed directly to `editor/title` in `navigation@20`; it does not depend on editor focus or a document language.

The menu shows **Translate Selection** only when non-whitespace text is selected and **Translate Markdown File** only for Markdown documents. Configuration items show the current target language, provider and comment translation state, followed by credential configuration and native DevLingo Settings. Escape closes the menu without side effects. All actions are keyboard accessible and existing translation commands are reused.

**Target Language** opens the centralized language picker and marks the current language. Choosing a different language updates `devlingo.targetLanguage` without a notification; an existing workspace override is updated at workspace scope so it takes effect. **Translation Provider** opens the existing provider selector; missing credentials are shown as **API key required**, and the resolver offers the existing secure configuration command. The menu only receives a boolean credential-status reader and never retrieves keys.

**Comment Translation** toggles `devlingo.commentTranslationEnabled` (default `true`). Disabled hover returns no translation and starts no provider request, including suppressing a pending result if disabled while it is loading. Re-enabling takes effect without reloading. **DevLingo Settings** opens native VS Code Settings filtered to `devlingo`.

Right-click selected text for **DevLingo: Translate Selection**, or right-click a Markdown document for **DevLingo: Translate Markdown File**. The Command Palette also exposes **Change Target Language**, **Toggle Comment Translation**, **Configure Provider API Key**, **Remove Provider API Key** and the existing provider selector. No sidebar, WebView or permanent status-bar item is added.

For a visual check, launch the Extension Development Host with `F5`: verify the globe on TypeScript and Markdown editors, select and clear text to check menu actions, change the language/provider and reopen the menu, toggle comment translation and hover a comment, then open Settings and try the context-menu translation actions. Test credential input only with your own key; it remains masked and stored in SecretStorage. Automated tests cover native command routing and configuration behavior. The toolbar and command center were visually checked in an isolated Extension Development Host with Markdown and TypeScript editors; real cloud translation still requires your own provider credentials.

## Goals

DevLingo is built around a simple idea: developers should be able to understand documentation and source-code comments without constantly switching between their editor and external translation tools.

The project focuses on:

- Developer-friendly translation
- Non-destructive comment translation
- Markdown-aware translation
- Clean editor integration
- Extensible translation providers
- Fast and simple workflows

## Project Status

DevLingo is currently under active development.

DevLingo supports OpenAI, DeepL and Google Cloud Translation using your own API key, alongside an offline development mock. Mock remains the default; no text is sent to a cloud provider until that provider is selected.

To try it, press `F5`, select text in the Extension Development Host, and run **DevLingo: Translate Selection** from the Command Palette. Choose English, French, Spanish, or German. The mock result (for example, `[fr] Hello world`) opens in a temporary document beside the original without modifying it.

`TranslationService` depends only on `TranslationProvider`. Provider metadata and construction live in `src/translation/providers/`. Future providers can be added to the registry and resolver without changing selection, hover, Markdown translation or cache logic.

### Provider infrastructure and credentials

`devlingo.translationProvider` defaults to `mock`. **DevLingo: Change Translation Provider** offers **Mock Provider (Development)**, **Google Cloud Translation**, **DeepL**, and **OpenAI**.

Use **DevLingo: Configure Provider API Key**, choose **OpenAI**, and enter your key in the masked input. Keys are trimmed and saved only through VS Code SecretStorage, under `devlingo.provider.<providerId>.apiKey`. Empty keys are rejected. Keys are never placed in settings, logged, displayed after storage or prefilled in the input. Saving a key does not perform remote validation or select a provider.

**DevLingo: Remove Provider API Key** lists only providers with saved credentials and deletes the chosen entry without showing its value. Tests use in-memory storage and fake cloud-provider clients, without real API requests or credentials.

Selecting a cloud provider without a key blocks translation with a controlled error and offers the existing configuration command. Unknown and unavailable providers never fall back to mock. Changing providers or saved credentials rebuilds translation features and caches without a reload, so stale results and old keys cannot mask the new configuration. Each cache belongs to a single provider lifetime and includes provider ID, text, target language and optional source language; pending requests are shared and failed requests can be retried.

### Try OpenAI translation

1. Press `F5` to launch the Extension Development Host.
2. Run **DevLingo: Configure Provider API Key**, choose **OpenAI**, and enter your key.
3. Run **DevLingo: Change Translation Provider** and choose **OpenAI**.
4. Set `devlingo.targetLanguage` to `fr`.
5. Select `Hello, how are you?`, run **DevLingo: Translate Selection**, and choose French. Expect a natural French translation such as `Bonjour, comment allez-vous ?` in a separate document.
6. Hover over `// Fetch the authenticated user` to see the translated comment.
7. Open a saved `README.md` and run **DevLingo: Translate Markdown File** to create `README.fr.md` with protected formatting intact.

The official `openai` SDK uses the Responses API (`client.responses.create`) with the centrally defined `gpt-5.6-luna` model and reasoning effort `none`. Requests are non-streaming, have no tools, and use `store: false`. Source language is detected automatically unless an explicit language code is supplied. Model selection is not configurable yet.

Only the selected text, extracted comment, or Markdown prose segments are sent. Markdown parsing and preservation remain entirely in DevLingo's Markdown pipeline; code blocks, inline code, URLs and frontmatter are not sent for translation. Empty input never triggers a request. Hover and Markdown reuse their existing bounded caches. Selection commands intentionally translate anew when invoked.

Authentication/access, rate-limit, connection, service, empty-response and unexpected errors become concise domain errors without raw SDK details or credentials. Commands display controlled error messages; hover failures remain quiet and retryable. SDK retries are disabled to avoid hidden repeated calls, and requests time out after 30 seconds. Translation quality and availability depend on OpenAI and your account's access, quota and billing. Automated validation covers fake Responses clients; real translation must be checked manually with your own key.

### Try DeepL translation

1. Press `F5` to launch the Extension Development Host.
2. Run **DevLingo: Configure Provider API Key**, choose **DeepL**, and enter your DeepL API key.
3. Run **DevLingo: Change Translation Provider** and select **DeepL**.
4. Set `devlingo.targetLanguage` to `fr`.
5. Select `Hello, how are you?`, run **DevLingo: Translate Selection**, and choose French.
6. Hover over `// Fetch the authenticated user`.
7. Open a saved `README.md` and run **DevLingo: Translate Markdown File** to create `README.fr.md`.

The official `deepl-node` SDK constructs `DeepLClient` with the injected key and calls only `translateText()` with `preserveFormatting: true`. It selects the API Free or Pro endpoint from the key. Automatic source detection uses `null`; explicit source codes are normalized and validated by DeepL. Targets reuse the supported-language registry, with only English mapped to `en-US` (French, German and Spanish keep their codes).

Keys remain exclusively in VS Code SecretStorage at `devlingo.provider.deepl.apiKey`. No remote key validation happens when saving. Missing keys offer the existing configuration flow; authentication, usage limits, rate limits, connection, service and invalid-language errors are controlled without exposing SDK details. SDK retries are disabled, requests use a 30-second timeout, and platform-information headers are disabled.

Only the required text or protected Markdown prose segments are sent. No document translation, language-discovery, usage-dashboard, glossary or writing API is used. Markdown structure continues to be managed entirely by DevLingo. Automated tests use fake clients and fake credentials, with no real DeepL requests; live translation requires manual testing with your own API key and available quota.

### Try Google Cloud Translation

1. Press `F5` to launch the Extension Development Host.
2. Run **DevLingo: Configure Provider API Key**, choose **Google Cloud Translation**, and enter your Google Cloud API key.
3. Run **DevLingo: Change Translation Provider** and choose **Google Cloud Translation**.
4. Set `devlingo.targetLanguage` to `fr`.
5. Select `Hello, how are you?`, run **DevLingo: Translate Selection**, and choose French.
6. Hover over `// Fetch the authenticated user`.
7. Open a saved `README.md` and run **DevLingo: Translate Markdown File** to create `README.fr.md`.

Google uses the official `@google-cloud/translate` SDK's **Basic v2** client, constructed with the injected API key. Translation calls use `format: 'text'` and the existing target codes `en`, `fr`, `es`, `de`. Automatic source detection omits `from` (no separate detection request). Explicit source codes are normalized. Empty input never triggers a request, and SDK retries are disabled.

The key is saved exclusively through VS Code SecretStorage under `devlingo.provider.google.apiKey`; no service account or Advanced v3 client is configured. Requests use Google's official endpoint, without an environment-selected custom backend. No key validation request occurs on saving; missing keys offer the existing configuration flow. Structured API reasons distinguish authentication, API enablement, key restrictions, billing, quotas and rate limits. Network, service and invalid-language failures are also sanitized into domain errors without raw SDK messages or credentials. Unrecognized failures receive a generic controlled message.

Only selected text, comment text or protected Markdown prose segments are sent. Google has its own provider identity in the existing cache. Markdown preservation remains managed by DevLingo, with no Google-specific parsing, document API or workspace context. Unit tests use fake clients and fake identifiers; live validation requires a Google Cloud project with Cloud Translation API enabled, billing/quota available, and an API key permitted to call it.

Hover over a nonempty code comment to see **DevLingo** and its translation without modifying the file. Set `devlingo.targetLanguage` to `en`, `fr` (the default), `es`, or `de` in VS Code settings. Hover translations use a bounded in-memory cache shared across documents, keyed by comment text and target language; pending requests are reused and failures can be retried.

Comment hover supports JavaScript, JSX, TypeScript, TSX, Vue, PHP, CSS, SCSS, Less, Python, shell scripts, and HTML. It recognizes language-appropriate `//`, `#`, `/* */`, and `<!-- -->` comments, including multiline blocks. The MVP uses a conservative lexical scanner, not a full language parser: template-string contents and some complex embedded expressions are skipped to avoid translating normal code.

### Translate a Markdown file

Press `F5`, open a saved local Markdown file, and run **DevLingo: Translate Markdown File**. The command uses `devlingo.targetLanguage`, shows progress, creates a sibling file such as `README.fr.md`, and opens the result. The source file remains untouched. Existing output requires **Replace** confirmation; **Cancel** leaves it unchanged. Save or close a dirty output document before replacing it.

Use `test/fixtures/markdown-sample.md` to try headings, code, links, lists, tables, frontmatter and HTML together. With target `fr`, the output is `test/fixtures/markdown-sample.fr.md`. Run the command again to check both **Cancel** and **Replace**.

The Markdown parser identifies text by source offsets. Headings, lists, task lists, blockquotes, emphasis, links and table cells are translated. Code fences (including tildes), inline code, URLs, link destinations and titles, images, reference definitions, horizontal rules, YAML frontmatter, raw HTML and HTML comments are preserved. Original line endings and blank lines are retained. Hover and Markdown use the same bounded cache implementation.

Provider output is escaped as Markdown prose: the source may contain `\[fr\]`, which renders as `[fr]`. No placeholders are used. For this phase, translation uses separate text segments around formatting and code, preserving shortcut/collapsed reference labels and conservatively skipping text overlapping HTML. Remote/virtual files and untitled documents are not written; save the document to a local file first. Frontmatter protection applies to a closed YAML block at the start of the document.

## Roadmap

- [x] Translate the active Markdown file
- [x] Select a target language
- [x] Preserve Markdown syntax during translation
- [x] Ignore fenced code blocks
- [x] Preserve inline code
- [x] Translate code comments on hover
- [x] Automatic source-language detection (OpenAI)
- [x] Translation caching
- [x] Configurable translation providers
- [ ] VS Code Marketplace release

## Development

### Requirements

- Node.js 22 or later
- npm
- Visual Studio Code
- Git

### Install

Clone the repository and install the dependencies:

```bash
git clone https://github.com/AndrixNg1/DevLingo
cd devlingo
npm install
```

Open the project in VS Code:

```bash
code .
```

Press `F5` to start a new Extension Development Host instance.

## Project Structure

```text
src/
├── commands/
├── comments/
├── config/
├── hover/
├── markdown/
├── translation/
│   └── providers/
├── utils/
└── extension.ts
```

## Contributing

DevLingo is currently in early development.

Issues, ideas and contributions are welcome as the project evolves.

## License

This project is licensed under the MIT License.
