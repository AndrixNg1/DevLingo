# Real DevLingo demo script

No demo was recorded for this documentation update. There are no existing screenshot/video assets in the repository and no temporary credential was supplied through the normal UI for this task. This is a recording script, not evidence of a cloud translation run.

## Prepare before recording

1. Install the trusted packaged VSIX in normal VS Code and open a clean demo folder.
2. Open DevLingo from the globe toolbar icon. Select **DeepL** through **Translation Provider**.
3. Configure the temporary key only through **Configure Provider API Key → DeepL**. Stop recording while entering credentials; do not export SecretStorage or use settings/environment files.
4. Choose **French** as target and enable comment translation. Preflight a real hover and selected-text translation.
5. Create `demo.ts` with `// Fetch the authenticated user` and a sentence `Hello world` to select. Create `README.md` containing a heading, paragraph, inline code, fenced code and a link as in the [Markdown example](markdown.md).
6. Hide terminals, logs, unrelated files, personal notifications and account identifiers. Ensure no key appears on screen.

## Record approximately 30–60 seconds

| Time | Action |
| --- | --- |
| 0–8 s | Show the globe, open the command center, show DeepL and French, then close it |
| 8–18 s | Hover the English comment; wait for and show the real French result |
| 18–30 s | Select the sentence, choose Translate Selection and French, then show the output beside the unchanged source |
| 30–48 s | Open README.md and run Translate Markdown File; wait for README.fr.md |
| 48–60 s | Show source and output side by side, focusing on unchanged code and link destination |

Actual network latency may require another take. Do not substitute fabricated translations for an unsuccessful request. Capture at a readable resolution and avoid rapid cursor movement.

## Review and cleanup

Review every frame for secrets before publishing. Save the reviewed recording as `docs/assets/devlingo-demo.gif` (or a separately documented video format); then add its relative link to README's Demo section. Do not add a broken image link before the asset exists. Remove disposable demo translations from the project and revoke the temporary DeepL API key used for the demo. Never export or copy it out of SecretStorage.
