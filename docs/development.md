# Development

## Requirements

Use Git, npm, Node.js 22 (the CI version) and VS Code 1.140.0 or later. Linux tests need a display; CI uses Xvfb. Dependencies are locked in `package-lock.json`.

```sh
git clone https://github.com/AndrixNg1/DevLingo.git
cd DevLingo
npm install
code .
```

For a reproducible dependency installation, use `npm ci`.

## Run locally

Press **F5** and choose **Run Extension**, or **Run Extension (isolated)** to disable other installed extensions in the development host. The pre-launch task runs the TypeScript watcher. A separate Extension Development Host window loads this checkout; configure credentials there using DevLingo's normal masked input. Do not add credentials to settings, environment files or source code.

The workspace disables the JavaScript debugger Network view to avoid inspector `Missing dataLength in event` errors; provider HTTP requests still work. Deprecation notices from dependencies are not necessarily translation failures. Use the visible DevLingo error from a selection translation when diagnosing credentials or quota; hover errors stay quiet.

## Validation

```sh
npm run lint
npm run compile
npm test
```

`npm test` also runs compilation and lint through `pretest`. The VS Code test runner uses 1.140.0 and may download it on first run. Tests use fixtures, fake SecretStorage and injected provider clients; they do not need real keys or paid requests. On headless Linux, install Xvfb and use `xvfb-run -a npm test` as CI does.

For feature changes, manually check selection, comment hover and Markdown in the development host. Test provider switches, missing credentials, cancellation, overwrite confirmation and protected Markdown. See the [demo script](demo-script.md).

## Package and install

The repository has no packaging npm script. With the VS Code Extension Manager (`vsce`) available:

```sh
vsce ls
vsce package
code --install-extension ./devlingo-1.0.0.vsix --force
```

If `vsce` is not installed, install the CLI with `npm install -g @vscode/vsce` or invoke `npx @vscode/vsce package`. Packaging runs `vscode:prepublish`, which compiles TypeScript. Version 1.0.0 and publisher `andrixng` are declared in the manifest; packaging does not require publishing credentials.

Review `.vscodeignore` and the archive contents before distributing it; do not include keys, generated translations or private demo files. Keep `assets/icon.png` and the README's four PNG screenshots included. If files were deleted from `src`, clean their stale compiled files from `out` before packaging, since TypeScript compilation does not remove them.

### README images in the installed extension

`vsce` rewrites relative README image paths to HTTPS repository URLs. The manifest pins that resolution to `main`. Including a PNG in the archive does not make that remote URL available: the image must also exist on the public branch before the installed extension details page can load it.

Open **Extensions → DevLingo → Details** after installing the exact VSIX. Check the icon, README, all four screenshots and badges; a successful packaging command is not a visual check. See [Marketplace readiness](marketplace.md) for the current asset-hosting blocker and validation procedure.

VSIX packaging and installed translation behavior have already been validated by the maintainer. The final documentation image check is tracked separately in [Marketplace readiness](marketplace.md). For packaging or runtime changes, repeat testing in a normal VS Code window with the development host closed. No Marketplace publication or GitHub release is performed by these commands.
