import * as vscode from 'vscode';
import { translationErrorMessage } from '../translation/translationError';
import { languages } from '../config/languages';
import { getTargetLanguage, setTargetLanguage, isCommentTranslationEnabled, setCommentTranslationEnabled } from '../config/settings';
import { openCommandCenter, type CredentialStatusReader } from '../ui/commandCenter';

export async function changeTargetLanguage(): Promise<void> {
    const current = getTargetLanguage();
    const selected = await vscode.window.showQuickPick(
        languages.map(language => ({ label: language.label, description: language.code.toUpperCase(), detail: language.code === current ? 'Current' : undefined, code: language.code, picked: language.code === current })),
        { title: 'DevLingo: Select Target Language', placeHolder: 'Choose the default translation language' },
    );
    if (selected && selected.code !== current) {
        await setTargetLanguage(selected.code);
    }
}

export async function toggleCommentTranslation(): Promise<void> {
    await setCommentTranslationEnabled(!isCommentTranslationEnabled());
}

export function registerUICommands(hasApiKey: CredentialStatusReader): vscode.Disposable {
    const register = (id: string, action: () => Promise<unknown>) => vscode.commands.registerCommand(id, async () => {
        try {
            await action();
        } catch (error) {
            await vscode.window.showErrorMessage(translationErrorMessage(error, 'DevLingo: Unable to complete this action.'));
        }
    });
    return vscode.Disposable.from(
        register('devlingo.open', () => openCommandCenter(hasApiKey)),
        register('devlingo.changeTargetLanguage', changeTargetLanguage),
        register('devlingo.toggleCommentTranslation', toggleCommentTranslation),
        register('devlingo.openSettings', async () => vscode.commands.executeCommand('workbench.action.openSettings', 'devlingo')),
    );
}
