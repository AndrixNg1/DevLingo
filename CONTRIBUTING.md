# Contributing to DevLingo

Contributions are welcome. Follow the [code of conduct](CODE_OF_CONDUCT.md). For bugs, include a minimal reproduction and environment details; for larger changes, discuss the problem in an issue first. Never include credentials or confidential source content.

## Workflow

1. Fork [AndrixNg1/DevLingo](https://github.com/AndrixNg1/DevLingo).
2. Clone your fork using its GitHub clone URL, enter the `DevLingo` directory and open it in VS Code. See [development requirements](docs/development.md#requirements).
3. Run `npm install` (or `npm ci` for the locked dependency set).
4. Create a branch, for example `git switch -c fix/describe-your-change`. `feat/…`, `fix/…`, `docs/…` and `refactor/…` are suggested conventions.
5. Implement a focused change following the existing TypeScript and ESLint configuration; update documentation and meaningful tests where relevant.
6. Run `npm run lint`.
7. Run `npm run compile`.
8. Run `npm test`; tests use offline fixtures and require no real API key.
9. Press **F5 → Run Extension** and manually verify the affected workflow in the Extension Development Host. For packaging/runtime changes, also [test a packaged VSIX](docs/development.md#package-and-install).
10. Review your diff for credentials and unrelated/generated files, commit and push your branch, then open a pull request against `main`.

Describe the problem, resulting behavior, tests and limitations. Use the PR template and update docs where behavior changes. Avoid unnecessary dependencies and abstractions; tests should verify observable behavior, not mirror implementation.

## Useful contribution areas

Bug fixes, translation providers, language support, Markdown edge cases, documentation, UX improvements and tests are welcome. See [development](docs/development.md), [architecture](docs/architecture.md), [provider guide](docs/providers.md#adding-a-new-provider) and [roadmap](ROADMAP.md).

Provider-specific code belongs in concrete providers, never Markdown, hover or selection logic. Unit tests remain offline through injected clients and fixtures. Manual cloud tests use your own key through the normal SecretStorage configuration command.

Report security concerns using [SECURITY.md](SECURITY.md), without public exploit details or secrets.
