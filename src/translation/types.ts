export interface TranslationOptions {
    targetLanguage: string;
    sourceLanguage?: string;
}

export interface TranslationProvider {
    translate(text: string, options: TranslationOptions): Promise<string>;
}
