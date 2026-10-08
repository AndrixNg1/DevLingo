import * as vscode from 'vscode';
import { registerTranslateMarkdownCommand } from '../commands/translateMarkdown';
import { registerTranslateSelectionCommand } from '../commands/translateSelection';
import { getTranslationProvider, onTranslationProviderChanged } from '../config/settings';
import { registerCommentTranslationHover } from '../hover/commentTranslationHover';
import { MarkdownTranslator } from '../markdown/markdownTranslator';
import { ProviderNotAvailableError, ProviderNotConfiguredError, UnknownTranslationProviderError, type ProviderResolver } from './providers/providerResolver';
import type { TranslationProvider } from './types';
import { TranslationService } from './translationService';

/** Rebuild feature lifetimes on a provider change, discarding provider-specific caches. */
export async function registerTranslationFeatures(resolver: ProviderResolver): Promise<vscode.Disposable> {
    let features: vscode.Disposable | undefined;
    let disposed = false;
    let revision = 0;
    const refresh = async () => {
        const currentRevision = ++revision;
        features?.dispose();
        features = undefined;
        let provider: TranslationProvider;
        try {
            provider = await resolver.resolve(getTranslationProvider());
        } catch (error) {
            if (disposed || currentRevision !== revision) {
                return;
            }
            // Keep commands registered, but never translate using a silent mock fallback.
            provider = { async translate() { throw error; } };
            const message = error instanceof ProviderNotAvailableError || error instanceof ProviderNotConfiguredError
                || error instanceof UnknownTranslationProviderError
                ? error.message : 'DevLingo: Unable to resolve the translation provider.';
            void vscode.window.showErrorMessage(message);
        }
        if (disposed || currentRevision !== revision) {
            return;
        }
        const service = new TranslationService(provider);
        features = vscode.Disposable.from(
            registerTranslateSelectionCommand(service),
            registerTranslateMarkdownCommand(new MarkdownTranslator(service)),
            registerCommentTranslationHover(service),
        );
    };
    const listener = onTranslationProviderChanged(() => { void refresh(); });
    await refresh();
    return new vscode.Disposable(() => { disposed = true; revision++; listener.dispose(); features?.dispose(); });
}
