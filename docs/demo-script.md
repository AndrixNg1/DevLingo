# Real DevLingo demo script

Four real screenshots were captured with the installed extension and working DeepL translations. No GIF is bundled. Use this script to record the installed DevLingo 1.0.0 extension. Screenshots must be real UI captures; translated results require a working provider configured through the normal masked input. Never fabricate output.

## Prepare before recording

1. Install the trusted packaged VSIX in normal VS Code and open a clean demo folder.
2. Open DevLingo from the globe toolbar icon. Select **DeepL** through **Translation Provider**.
3. Configure the temporary key only through **Configure Provider API Key → DeepL**. Stop recording while entering credentials; do not export SecretStorage or use settings/environment files.
4. Choose **French** as target and enable comment translation. Preflight a real hover and selected-text translation.
5. Create `demo.ts` with `// Fetch the authenticated user` and a sentence `Hello world` to select. Create `README.md` containing a heading, paragraph, inline code, fenced code and a link as in the [Markdown example](markdown.md).
6. Hide terminals, logs, unrelated files, personal notifications and account identifiers. Ensure no key appears on screen.

## Record approximately 20–40 seconds

| Time | Action |
| --- | --- |
| 0–5 s | Show the globe, open the command center, show DeepL and French, then close it |
| 5–12 s | Hover the English comment; wait for and show the real French result |
| 12–22 s | Select the sentence, choose Translate Selection and French, then show the output beside the unchanged source |
| 22–32 s | Open README.md and run Translate Markdown File; wait for README.fr.md |
| 32–40 s | Show source and output side by side, focusing on unchanged code and link destination |

Actual network latency may require another take. Do not substitute fabricated translations for an unsuccessful request. Capture at a readable resolution and avoid rapid cursor movement.

## Review and cleanup

Review every frame for secrets before publishing. Save the reviewed recording as `assets/marketplace/devlingo-demo.gif` (or a separately documented video format); then add its relative link to README's Demo section. Do not add a broken image link before the asset exists. Remove disposable demo translations from the project and revoke the temporary DeepL API key used for the demo. Never export or copy it out of SecretStorage.

## Marketplace screenshots

Use the same theme and a clean `DevLingo-demo` folder with breadcrumbs and unnecessary panels hidden. Save captures under `assets/marketplace/`:

- `command-center.png`: select a sentence in demo.ts, click the globe, and show the action/state menu.
- `provider-selection.png`: open Translation Provider; show Google Cloud Translation, DeepL and OpenAI.
- `comment-translation.png`: hover the English comment and wait for a real French translation.
- `markdown-translation.png`: run Translate Markdown File, then arrange README.md and README.fr.md side by side with code, inline code and the link visible.

Configure the temporary DeepL key before capturing. If credentials are unavailable, leave translated-result assets pending; do not create fake screenshots. Review every image and GIF for credentials and personal information. Revoke the temporary DeepL key after recording/testing.
