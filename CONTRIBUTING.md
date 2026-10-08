# Contributing to DevLingo

Contributions are welcome. Follow the [code of conduct](CODE_OF_CONDUCT.md). For bugs, include a minimal reproduction and environment details; for larger changes, discuss the problem in an issue first. Never include credentials or confidential source content.

## Workflow

1. Fork [AndrixNg1/DevLingo](https://github.com/AndrixNg1/DevLingo) and clone your fork using its GitHub clone URL.
2. Install dependencies with `npm install` (or `npm ci` for the locked dependency set).
3. Create a branch; `feat/…`, `fix/…`, `docs/…` and `refactor/…` are suggested conventions, not enforced requirements.
4. Implement a focused change, following the existing TypeScript and ESLint configuration.
5. Run `npm run lint`, `npm run compile` and `npm test`.
6. For user-facing changes, test in the Extension Development Host; for packaging/runtime changes, test a packaged VSIX when relevant.
7. Review your diff for credentials and unrelated/generated files, then commit, push your branch and open a pull request against `main`.

Describe the problem, resulting behavior, tests and limitations. Use the PR template and update docs where behavior changes. Avoid unnecessary dependencies and abstractions; tests should verify observable behavior, not mirror implementation.

## Useful contribution areas

Bug fixes, translation providers, language support, Markdown edge cases, documentation, UX improvements and tests are welcome. See [development](docs/development.md), [architecture](docs/architecture.md), [provider guide](docs/providers.md#adding-a-new-provider) and [roadmap](ROADMAP.md).

Provider-specific code belongs in concrete providers, never Markdown, hover or selection logic. Unit tests remain offline through injected clients and fixtures. Manual cloud tests use your own key through the normal SecretStorage configuration command.

Report security concerns using [SECURITY.md](SECURITY.md), without public exploit details or secrets.
