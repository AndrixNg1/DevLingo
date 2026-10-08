import * as vscode from 'vscode';
import type { SecretManager } from '../config/secrets';
import { registerTranslateMarkdownCommand } from '../commands/translateMarkdown';
import { registerTranslateSelectionCommand } from '../commands/translateSelection';
import { getTranslationProvider, onTranslationProviderChanged } from '../config/settings';
import { registerCommentTranslationHover } from '../hover/commentTranslationHover';
import { MarkdownTranslator } from '../markdown/markdownTranslator';
import { ProviderNotAvailableError, ProviderNotConfiguredError, UnknownTranslationProviderError, type ProviderResolver } from './providers/providerResolver';
import { getProviderMetadata } from './providers/providerRegistry';
import type { TranslationProvider } from './types';
import { TranslationService } from './translationService';

/** Rebuild feature lifetimes on a provider change, discarding provider-specific caches. */
export async function registerTranslationFeatures(resolver: ProviderResolver, secrets?: SecretManager): Promise<vscode.Disposable> {
    let features: vscode.Disposable | undefined;
    let disposed = false;
    let revision = 0;
    const refresh = async () => {
        const currentRevision = ++revision;
        features?.dispose();
        features = undefined;
        const configuredProvider = getTranslationProvider();
        let provider: TranslationProvider;
        try {
            provider = await resolver.resolve(configuredProvider);
        } catch (error) {
            if (disposed || currentRevision !== revision) {
                return;
            }
            // Keep commands registered, but never translate using a silent fallback.
            provider = { async translate() { throw error; } };
            const message = error instanceof ProviderNotAvailableError || error instanceof ProviderNotConfiguredError
                || error instanceof UnknownTranslationProviderError
                ? error.message : 'DevLingo: Unable to resolve the translation provider.';
            if (error instanceof ProviderNotConfiguredError) {
                void vscode.window.showErrorMessage(`DevLingo: ${getProviderMetadata(error.providerId).displayName} requires an API key.`, 'Configure', 'Later').then(action => {
                    if (action === 'Configure' && !disposed && currentRevision === revision) {
                        void vscode.commands.executeCommand('devlingo.configureProviderApiKey', error.providerId);
                    }
                });
            } else {
                void vscode.window.showErrorMessage(message);
            }
        }
        if (disposed || currentRevision !== revision) {
            return;
        }
        const service = new TranslationService(provider, typeof configuredProvider === 'string' ? configuredProvider : 'unknown');
        features = vscode.Disposable.from(
            registerTranslateSelectionCommand(service),
            registerTranslateMarkdownCommand(new MarkdownTranslator(service)),
            registerCommentTranslationHover(service),
        );
    };
    const listener = onTranslationProviderChanged(() => { void refresh(); });
    const credentialsListener = secrets?.onDidChangeApiKey(() => { void refresh(); });
    await refresh();
    return new vscode.Disposable(() => { disposed = true; revision++; listener.dispose(); credentialsListener?.dispose(); features?.dispose(); });
}
