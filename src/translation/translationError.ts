/** Only controlled domain errors may be displayed; SDK details never leave providers. */
export class TranslationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TranslationError';
    }
}

export function translationErrorMessage(error: unknown, fallback: string): string {
    return error instanceof TranslationError ? error.message : fallback;
}
