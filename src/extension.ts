import * as vscode from 'vscode';
import { registerUICommands } from './commands/uiCommands';
import { registerProviderCommands } from './commands/providerCommands';
import { SecretManager } from './config/secrets';
import { ProviderResolver } from './translation/providers/providerResolver';
import { registerTranslationFeatures } from './translation/registerTranslationFeatures';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const secrets = new SecretManager(context.secrets);
    const resolver = new ProviderResolver(secrets);
    context.subscriptions.push(registerUICommands(id => secrets.hasApiKey(id)), registerProviderCommands(secrets), await registerTranslationFeatures(resolver, secrets));
}
