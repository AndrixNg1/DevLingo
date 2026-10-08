import * as vscode from 'vscode';
import type { SecretManager } from '../config/secrets';
import { getTranslationProvider, setTranslationProvider } from '../config/settings';
import { getAvailableProviders, getCredentialProviders, getProviderMetadata, isTranslationProviderId } from '../translation/providers/providerRegistry';

export async function configureProviderApiKey(secrets: SecretManager, providerId?: unknown): Promise<void> {
    try {
        const requested = isTranslationProviderId(providerId) ? getProviderMetadata(providerId) : undefined;
        const provider = requested ? { label: requested.displayName, provider: requested } : await vscode.window.showQuickPick(
            getCredentialProviders().map(provider => ({ label: provider.displayName, description: provider.description, provider })),
            { title: 'DevLingo: Configure API Key', placeHolder: 'Choose a translation provider' },
        );
        if (!provider) {
            return;
        }
        const value = await vscode.window.showInputBox({
            title: `DevLingo — ${provider.label}`,
            prompt: `Enter your ${provider.label} API key.`,
            password: true,
            ignoreFocusOut: true,
            validateInput: value => value.trim() ? undefined : 'Enter a nonempty API key.',
        });
        if (value === undefined) {
            return;
        }
        await secrets.setApiKey(provider.provider.id, value);
        await vscode.window.showInformationMessage(`DevLingo: ${provider.label} API key saved securely.`);
    } catch {
        await vscode.window.showErrorMessage('DevLingo: Unable to save provider credentials.');
    }
}

export async function removeProviderApiKey(secrets: SecretManager): Promise<void> {
    try {
        const configured = [];
        for (const provider of getCredentialProviders()) {
            if (await secrets.hasApiKey(provider.id)) {
                configured.push({ label: provider.displayName, provider });
            }
        }
        if (!configured.length) {
            await vscode.window.showInformationMessage('DevLingo: No provider credentials are configured.');
            return;
        }
        const provider = await vscode.window.showQuickPick(configured, { title: 'DevLingo: Remove API Key', placeHolder: 'Choose a translation provider' });
        if (!provider) {
            return;
        }
        const confirmed = await vscode.window.showWarningMessage(
            `DevLingo: Remove the saved ${provider.label} API key?`,
            { modal: true }, 'Remove', 'Cancel',
        );
        if (confirmed !== 'Remove') {
            return;
        }
        await secrets.deleteApiKey(provider.provider.id);
        await vscode.window.showInformationMessage(`DevLingo: ${provider.label} API key removed.`);
    } catch {
        await vscode.window.showErrorMessage('DevLingo: Unable to remove provider credentials.');
    }
}

export async function changeTranslationProvider(): Promise<void> {
    try {
        const current = getTranslationProvider();
        const provider = await vscode.window.showQuickPick(
            getAvailableProviders().map(provider => ({ label: provider.displayName, description: provider.id === current ? 'Current' : undefined, detail: provider.description, picked: provider.id === current, provider })),
            { title: 'DevLingo: Translation Provider', placeHolder: 'Choose a translation provider' },
        );
        if (!provider || provider.provider.id === current) {
            return;
        }
        await setTranslationProvider(provider.provider.id);
    } catch {
        await vscode.window.showErrorMessage('DevLingo: Unable to change the translation provider.');
    }
}

export function registerProviderCommands(secrets: SecretManager): vscode.Disposable {
    return vscode.Disposable.from(
        vscode.commands.registerCommand('devlingo.configureProviderApiKey', (providerId?: unknown) => configureProviderApiKey(secrets, providerId)),
        vscode.commands.registerCommand('devlingo.removeProviderApiKey', () => removeProviderApiKey(secrets)),
        vscode.commands.registerCommand('devlingo.changeTranslationProvider', changeTranslationProvider),
    );
}
