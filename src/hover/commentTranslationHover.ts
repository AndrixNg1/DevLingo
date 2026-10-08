import * as vscode from 'vscode';
import { commentLanguageIds, extractComment } from '../comments/commentExtractor';
import { getTargetLanguage, isCommentTranslationEnabled } from '../config/settings';
import type { TranslationService } from '../translation/translationService';
import { TranslationCache } from '../translation/translationCache';

export class CommentTranslationHover implements vscode.HoverProvider {
    private readonly cache: TranslationCache;

    constructor(service: TranslationService) {
        this.cache = new TranslationCache(service);
    }

    async provideHover(document: vscode.TextDocument, position: vscode.Position,
        token: vscode.CancellationToken): Promise<vscode.Hover | undefined> {
        if (token.isCancellationRequested || !isCommentTranslationEnabled()) {
            return undefined;
        }
        const comment = extractComment(document.getText(), document.offsetAt(position), document.languageId);
        if (!comment) {
            return undefined;
        }
        const version = document.version;
        try {
            const translation = await this.cache.translate(comment.text, getTargetLanguage());
            if (token.isCancellationRequested || !isCommentTranslationEnabled() || document.version !== version) {
                return undefined;
            }
            const content = new vscode.MarkdownString('**DevLingo**\n\n🌐 ');
            content.appendText(translation);
            return new vscode.Hover(content, new vscode.Range(
                document.positionAt(comment.start), document.positionAt(comment.end),
            ));
        } catch {
            // Hover failures should not interrupt editing; the cache allows a retry.
            return undefined;
        }
    }
}

export function registerCommentTranslationHover(service: TranslationService): vscode.Disposable {
    return vscode.languages.registerHoverProvider(
        commentLanguageIds.map(language => ({ language })), new CommentTranslationHover(service),
    );
}
