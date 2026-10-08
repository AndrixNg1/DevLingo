# Security policy

DevLingo 1.0.0 is being prepared for its first public release. Security fixes currently target the latest development version; there is no maintenance commitment for earlier builds.

## Credentials and translated content

API keys are entered through DevLingo's masked **Configure Provider API Key** command and stored using VS Code SecretStorage. They are not stored in workspace settings, project files or test fixtures. Credential commands do not prefill or reveal saved keys. Providers map failures to controlled messages instead of displaying raw SDK errors.

Never commit credentials, put them in documentation, or include them in public issues, logs, screenshots or recordings. Inspect demo assets before sharing them. If a key is exposed, revoke it with the provider and replace it through DevLingo's normal command; deleting a file or Git commit does not revoke a key.

Cloud translation sends the relevant text to the selected provider. Markdown protection limits that workflow to extracted prose; selection translation sends exactly the selected text. Review provider policies before translating sensitive material. This policy does not promise that external services retain no data.

## Reporting a vulnerability

Check the repository's [security reporting page](https://github.com/AndrixNg1/DevLingo/security). If GitHub offers **Report a vulnerability**, use private vulnerability reporting. Its availability has not been verified for this repository.

If no private reporting option is available, do not open a public issue containing exploit details or credentials. You may open a minimal issue requesting a private reporting channel without sensitive details. The maintainer should configure and document a private reporting channel before Marketplace publication. No security email address or response-time guarantee is currently declared.

Provide affected versions, impact and safe reproduction steps privately once a channel is available. Never send a working API key as part of the report.
