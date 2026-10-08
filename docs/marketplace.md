# Marketplace preparation

The manifest remains at the maintainer's version 1.0.0. Nothing has been published or tagged.

## Prepared

- Maintainer artwork normalized from `assets/Icône.png` to `assets/icon.png` without changing its PNG contents: 1254 × 1254, RGB, no alpha channel.
- Description covering comments, selected text and Markdown; accurate GitHub repository/homepage/issue links and MIT licensing.
- `Other` category: translation is not a VS Code display-language pack, formatter or programming-language implementation.
- Nine focused keywords, below the Marketplace's 30-keyword limit.
- Dark banner `#0B1830` matching the icon's navy background.
- Four real installed-extension captures under `assets/marketplace/`, including DeepL French hover and Markdown output; no synthetic UI or translations.
- Real selection translation checked: Hello world opens Bonjour tout le monde beside the unchanged source.
- Real Markdown output checked for unchanged fenced code, inline code and link destination.
- `.vscodeignore` excludes source/test output, fixture files, GitHub templates and contributor-only files; public assets and runtime dependencies remain included.

## Still required

- Confirm the maintainer's real Marketplace publisher ID; do not invent one. Local VSIX installation can succeed without a publishable identity.
- A reviewed GIF is not bundled: the live recording was interrupted when the demo window became unavailable. Follow [the exact recording script](demo-script.md) for a new recording; no synthetic GIF is provided.
- Review all final images for secrets/personal information and test the exact final VSIX.
- Revoke the temporary DeepL key after demonstration/testing.

Before publication, inspect `vsce ls`, run lint/compile/tests and `vsce package`, then install the generated VSIX in a normal VS Code instance. Publication, Git tags, releases and commits require a separate maintainer action.
