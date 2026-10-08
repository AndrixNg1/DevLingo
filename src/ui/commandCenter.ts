import * as vscode from 'vscode';
import { getTargetLanguage, getTranslationProvider, isCommentTranslationEnabled } from '../config/settings';
import { languages } from '../config/languages';
import { getProviderMetadata, isTranslationProviderId, type CredentialProviderId } from '../translation/providers/providerRegistry';

export type CredentialStatusReader = (providerId: CredentialProviderId) => Promise<boolean>;
export interface CommandCenterState {
    documentLanguage?: string;
    hasSelection: boolean;
    targetLanguage: string;
    providerId: unknown;
    commentsEnabled: boolean;
    credentialStatus: 'configured' | 'missing' | 'unknown' | 'not-required';
}
export interface CommandCenterItem extends vscode.QuickPickItem {
    command?: string;
}

/** Builds native menu items from a snapshot, without translation or credential access. */
export function buildCommandCenterItems(state: CommandCenterState): CommandCenterItem[] {
    const items: CommandCenterItem[] = [];
    const separator = (label: string) => items.push({ label, kind: vscode.QuickPickItemKind.Separator });
    if (state.hasSelection || state.documentLanguage === 'markdown') {
        separator('Translate');
        if (state.hasSelection) {
            items.push({ label: 'Translate Selection', command: 'devlingo.translateSelection' });
        }
        if (state.documentLanguage === 'markdown') {
            items.push({ label: 'Translate Markdown File', command: 'devlingo.translateMarkdown' });
        }
    }
    separator('Configuration');
    const language = languages.find(language => language.code === state.targetLanguage);
    items.push({ label: '$(globe) Target Language', description: language ? `${language.label} (${language.code.toUpperCase()})` : 'Unknown language', command: 'devlingo.changeTargetLanguage' });
    const provider = isTranslationProviderId(state.providerId) ? getProviderMetadata(state.providerId) : undefined;
    const credentialLabel = state.credentialStatus === 'missing' ? ' · API key required'
        : state.credentialStatus === 'unknown' ? ' · Unable to check API key' : '';
    items.push({ label: '$(cloud) Translation Provider', description: (provider?.displayName ?? 'Unknown provider') + credentialLabel, command: 'devlingo.changeTranslationProvider' });
    items.push({ label: '$(comment-discussion) Comment Translation', description: state.commentsEnabled ? 'Enabled' : 'Disabled', command: 'devlingo.toggleCommentTranslation' });
    separator('Credentials');
    items.push({ label: '$(key) Configure Provider API Key', detail: provider?.requiresApiKey && state.credentialStatus === 'missing' ? `${provider.displayName} requires an API key.` : undefined, command: 'devlingo.configureProviderApiKey' });
    separator('More');
    items.push({ label: '$(gear) DevLingo Settings', command: 'devlingo.openSettings' });
    return items;
}

export async function openCommandCenter(hasApiKey: CredentialStatusReader): Promise<void> {
    const providerId = getTranslationProvider();
    let credentialStatus: CommandCenterState['credentialStatus'] = 'not-required';
    if (isTranslationProviderId(providerId)) {
        const provider = getProviderMetadata(providerId);
        if (provider.requiresApiKey) {
            try {
                credentialStatus = await hasApiKey(provider.id) ? 'configured' : 'missing';
            } catch {
                credentialStatus = 'unknown';
            }
        }
    }
    const editor = vscode.window.activeTextEditor;
    const items = buildCommandCenterItems({
        documentLanguage: editor?.document.languageId,
        hasSelection: Boolean(editor && editor.document.getText(editor.selection).trim()),
        targetLanguage: getTargetLanguage(), providerId,
        commentsEnabled: isCommentTranslationEnabled(), credentialStatus,
    });
    const selected = await vscode.window.showQuickPick(items, { title: 'DevLingo', placeHolder: 'Choose an action', matchOnDescription: true });
    if (selected?.command) {
        await vscode.commands.executeCommand(selected.command);
    }
}
