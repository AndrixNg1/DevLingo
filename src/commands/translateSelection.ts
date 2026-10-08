import * as vscode from 'vscode';
import { translationErrorMessage } from '../translation/translationError';
import { languages } from '../config/languages';
import type { TranslationService } from '../translation/translationService';

export function registerTranslateSelectionCommand(service: TranslationService): vscode.Disposable {
    return vscode.commands.registerCommand('devlingo.translateSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            await vscode.window.showWarningMessage('DevLingo: Open an editor to translate a selection.');
            return;
        }
        const text = editor.document.getText(editor.selection);
        if (text.trim().length === 0) {
            await vscode.window.showWarningMessage('DevLingo: Select text to translate.');
            return;
        }
        const language = await vscode.window.showQuickPick(
            languages.map(({ label, code }) => ({ label, description: code, code })),
            { placeHolder: 'Select a target language' },
        );
        if (!language) {
            return;
        }
        try {
            const result = await service.translate(text, { targetLanguage: language.code });
            const document = await vscode.workspace.openTextDocument({ content: result, language: 'plaintext' });
            await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside, preview: true });
        } catch (error) {
            await vscode.window.showErrorMessage(translationErrorMessage(error, 'DevLingo: Unable to translate the selection.'));
        }
    });
}
