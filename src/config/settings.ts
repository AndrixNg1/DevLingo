import * as vscode from 'vscode';
import { languages } from './languages';
import { getProviderMetadata, isTranslationProviderId, type TranslationProviderId } from '../translation/providers/providerRegistry';

const namespace = 'devlingo';
const providerSetting = 'translationProvider';

export function getTargetLanguage(): string {
    const configured = vscode.workspace.getConfiguration(namespace).get<string>('targetLanguage', 'fr');
    return languages.some(language => language.code === configured) ? configured : 'fr';
}

/** Keep invalid/unknown selections visible to the resolver rather than falling back. */
export function getTranslationProvider(): unknown {
    return vscode.workspace.getConfiguration(namespace).get<unknown>(providerSetting, 'deepl');
}

export async function setTranslationProvider(providerId: TranslationProviderId): Promise<void> {
    if (!isTranslationProviderId(providerId) || !getProviderMetadata(providerId).available) {
        throw new Error('DevLingo: This translation provider is not available yet.');
    }
    await vscode.workspace.getConfiguration(namespace).update(providerSetting, providerId, vscode.ConfigurationTarget.Global);
}

export function onTranslationProviderChanged(listener: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration(`${namespace}.${providerSetting}`)) {
            listener();
        }
    });
}

export async function setTargetLanguage(code: string): Promise<void> {
    if (!languages.some(language => language.code === code)) {
        throw new Error('DevLingo: Unsupported target language.');
    }
    const configuration = vscode.workspace.getConfiguration(namespace);
    const target = configuration.inspect('targetLanguage')?.workspaceValue !== undefined
        ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
    await configuration.update('targetLanguage', code, target);
}

export function isCommentTranslationEnabled(): boolean {
    return vscode.workspace.getConfiguration(namespace).get<boolean>('commentTranslationEnabled', true);
}

export async function setCommentTranslationEnabled(enabled: boolean): Promise<void> {
    await vscode.workspace.getConfiguration(namespace).update('commentTranslationEnabled', enabled, vscode.ConfigurationTarget.Global);
}
