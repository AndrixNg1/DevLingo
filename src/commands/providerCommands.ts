import * as vscode from 'vscode';
import type { SecretManager } from '../config/secrets';
import { setTranslationProvider } from '../config/settings';
import { getAvailableProviders, getCredentialProviders } from '../translation/providers/providerRegistry';

export async function configureProviderApiKey(secrets: SecretManager): Promise<void> {
    try {
        const provider = await vscode.window.showQuickPick(
            getCredentialProviders().map(provider => ({ label: provider.displayName, description: provider.description, provider })),
            { placeHolder: 'Choose a cloud provider to configure' },
        );
        if (!provider) {
            return;
        }
        const value = await vscode.window.showInputBox({
            title: `DevLingo: Configure ${provider.label} API Key`,
            prompt: provider.provider.available
                ? 'Stored securely in VS Code. No remote validation is performed.'
                : 'Stored securely in VS Code. This provider is not active yet; no remote validation is performed.',
            password: true,
            ignoreFocusOut: true,
            validateInput: value => value.trim() ? undefined : 'Enter a nonempty API key.',
        });
        if (value === undefined) {
            return;
        }
        await secrets.setApiKey(provider.provider.id, value);
        const availability = provider.provider.available ? '' : ' This provider is not available yet.';
        await vscode.window.showInformationMessage(`DevLingo: ${provider.label} credentials saved.${availability}`);
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
        const provider = await vscode.window.showQuickPick(configured, { placeHolder: 'Choose provider credentials to remove' });
        if (!provider) {
            return;
        }
        await secrets.deleteApiKey(provider.provider.id);
        await vscode.window.showInformationMessage(`DevLingo: ${provider.label} credentials removed.`);
    } catch {
        await vscode.window.showErrorMessage('DevLingo: Unable to remove provider credentials.');
    }
}

export async function changeTranslationProvider(): Promise<void> {
    try {
        const provider = await vscode.window.showQuickPick(
            getAvailableProviders().map(provider => ({ label: provider.displayName, description: provider.description, provider })),
            { placeHolder: 'Choose an available translation provider' },
        );
        if (!provider) {
            return;
        }
        await setTranslationProvider(provider.provider.id);
        await vscode.window.showInformationMessage(`DevLingo: ${provider.label} selected.`);
    } catch {
        await vscode.window.showErrorMessage('DevLingo: Unable to change the translation provider.');
    }
}

export function registerProviderCommands(secrets: SecretManager): vscode.Disposable {
    return vscode.Disposable.from(
        vscode.commands.registerCommand('devlingo.configureProviderApiKey', () => configureProviderApiKey(secrets)),
        vscode.commands.registerCommand('devlingo.removeProviderApiKey', () => removeProviderApiKey(secrets)),
        vscode.commands.registerCommand('devlingo.changeTranslationProvider', changeTranslationProvider),
    );
}
