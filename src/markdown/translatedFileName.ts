export function translatedFileName(fileName: string, targetLanguage: string): string {
    if (!/^[a-z]{2,3}(?:-[a-zA-Z0-9]+)*$/.test(targetLanguage)) {
        throw new Error('Invalid target language');
    }
    return fileName.replace(/\.(?:md|markdown)$/i, '') + `.${targetLanguage}.md`;
}
