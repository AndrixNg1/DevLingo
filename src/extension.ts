import * as vscode from 'vscode';
import { registerTranslateSelectionCommand } from './commands/translateSelection';
import { MockTranslationProvider } from './translation/providers/mockTranslationProvider';
import { TranslationService } from './translation/translationService';

export function activate(context: vscode.ExtensionContext): void {
    const service = new TranslationService(new MockTranslationProvider());
    context.subscriptions.push(registerTranslateSelectionCommand(service));
}
