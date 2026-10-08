# Translation providers

DevLingo implements three cloud providers. DeepL is the default; every provider needs a user-supplied API key. There is no automatic fallback. Mock was removed from the extension; tests use deterministic fixtures under `src/test/helpers/` only. Gemini is not implemented.

Configure keys with **DevLingo → Configure Provider API Key → provider → masked input**, then select the provider through **Translation Provider**. SecretStorage is the sole credential persistence mechanism. Credentials are not prefilled, logged or saved in settings. Saving a key does not make an API request. Billing and credits belong to your provider account; this document does not quote prices.

## OpenAI

Implementation: [`openaiTranslationProvider.ts`](../src/translation/providers/openaiTranslationProvider.ts).

Uses the official SDK and non-streaming Responses API with the centralized `gpt-5.6-luna` model, reasoning effort `none`, translation instructions and `store: false`. The current extension has no model picker or ChatGPT sign-in flow. Access to this model must be available to the API account. Requests preserve outer whitespace. API credit/quota errors are distinguished from temporary rate limits. `store: false` is a request option, not a claim that the provider retains no data under any policy.

## DeepL

Implementation: [`deeplTranslationProvider.ts`](../src/translation/providers/deeplTranslationProvider.ts).

Uses the official `deepl-node` SDK and `translateText`. The SDK handles the API endpoint appropriate to the key. Target codes come from the shared language registry; English maps to US English. Normal UI requests use automatic source detection. Authentication, quota, rate-limit, connection and language failures become controlled errors.

## Google Cloud Translation

Implementation: [`googleTranslationProvider.ts`](../src/translation/providers/googleTranslationProvider.ts).

Uses the official `@google-cloud/translate` SDK, Cloud Translation **Basic v2** and API-key authentication. Advanced v3/service-account authentication is not implemented. Plain text translation supports automatic or explicitly supplied source language. Structured errors distinguish API enablement, key restrictions, authentication, billing, quota and network failures.

## Shared boundaries

Concrete providers implement [`TranslationProvider`](../src/translation/types.ts). Requests time out after 30 seconds and SDK retries are disabled. Errors exposed to users are controlled domain messages, without raw SDK details or credentials. Selection and Markdown commands display failures; hover remains quiet and retries on a later hover. These are implementation details, not guarantees about external service availability.

## Adding a new provider

1. Implement `TranslationProvider` under `src/translation/providers/`, keeping external SDK code there. Preserve empty input and define target/source mapping.
2. Add immutable metadata to `providerRegistry.ts`, including availability and credential requirements.
3. Add construction to `ProviderResolver`. Inject credentials through the existing SecretManager; never read keys from settings or hardcode them.
4. Update the `devlingo.translationProvider` enum and descriptions in `package.json`. Extend secure credential handling only if the existing API-key flow cannot express the provider's needs.
5. Map provider errors to sanitized `TranslationError` messages, without embedding raw exceptions, keys or request content.
6. Keep service/cache identity tied to the provider and preserve cache invalidation on provider/credential changes.
7. Add offline tests with an injected fake client for request options, language mapping, errors, whitespace, credentials and cache isolation.
8. Run lint, compile and tests; manually test selection, comment hover and Markdown with a key configured through the normal flow.
9. Check packaged VSIX behavior when appropriate and update user/provider documentation.

Do not add provider-specific branches to MarkdownTranslator, hover or selection. Features → TranslationService → TranslationProvider → concrete provider is the required boundary.
