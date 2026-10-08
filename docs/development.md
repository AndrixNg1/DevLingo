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
vsce package
code --install-extension ./devlingo-1.0.0.vsix
```

If `vsce` is not installed, invoke `npx @vscode/vsce package`. Packaging runs `vscode:prepublish`, which compiles TypeScript. Review `.vscodeignore` and the archive contents before distributing it; do not include keys, generated translations or private demo files. If files were deleted from `src`, clean their stale compiled files from `out` before packaging, since TypeScript compilation does not remove them.

VSIX packaging and installed-extension testing have already been validated by the maintainer. For packaging or runtime changes, repeat the test in a normal VS Code window with the development host closed. No Marketplace publication or GitHub release is performed by these commands.
