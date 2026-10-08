import * as vscode from 'vscode';
import { translationErrorMessage } from '../translation/translationError';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { getTargetLanguage } from '../config/settings';
import type { MarkdownTranslator } from '../markdown/markdownTranslator';
import { translatedFileName } from '../markdown/translatedFileName';
import { writeTranslatedFile } from '../markdown/writeTranslatedFile';

export function registerTranslateMarkdownCommand(translator: MarkdownTranslator): vscode.Disposable {
    return vscode.commands.registerCommand('devlingo.translateMarkdown', () => translateMarkdownFile(translator));
}

export async function translateMarkdownFile(translator: MarkdownTranslator): Promise<void> {
    const document = vscode.window.activeTextEditor?.document;
    if (!document) {
        await vscode.window.showWarningMessage('DevLingo: Open a Markdown file to translate.');
        return;
    }
    if (document.languageId !== 'markdown') {
        await vscode.window.showWarningMessage('DevLingo: The active file is not a Markdown document.');
        return;
    }
    if (document.isUntitled) {
        await vscode.window.showWarningMessage('DevLingo: Save the Markdown file before translating it.');
        return;
    }
    if (document.uri.scheme !== 'file') {
        await vscode.window.showWarningMessage('DevLingo: Markdown file translation currently supports local files.');
        return;
    }
    try {
        const targetLanguage = getTargetLanguage();
        const target = translatedFileName(document.uri.fsPath, targetLanguage);
        let replace = false;
        try {
            await fs.lstat(target);
            if (await aliasesOriginal(document.uri.fsPath, target)) {
                await vscode.window.showWarningMessage('DevLingo: The translated path points to the original file. Choose a different source filename.');
                return;
            }
            if (!await confirmReplacement(target)) {
                return;
            }
            replace = true;
        } catch (error) {
            if (!hasCode(error, 'ENOENT')) {
                throw error;
            }
        }
        const content = document.getText();
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'DevLingo: Translating Markdown...',
        }, async () => {
            const translated = await translator.translateMarkdown(content, targetLanguage);
            if (await aliasesOriginal(document.uri.fsPath, target)) {
                await vscode.window.showWarningMessage('DevLingo: The translated path points to the original file. Choose a different source filename.');
                return;
            }
            if (vscode.workspace.textDocuments.some(item => item.uri.fsPath === target && item.isDirty)) {
                await vscode.window.showWarningMessage('DevLingo: Save or close the unsaved translated file before replacing it.');
                return;
            }
            try {
                await writeTranslatedFile(target, translated, replace);
            } catch (error) {
                if (!replace && hasCode(error, 'EEXIST')) {
                    if (!await confirmReplacement(target)) {
                        return;
                    }
                    await writeTranslatedFile(target, translated, true);
                } else {
                    throw error;
                }
            }
            const output = await vscode.workspace.openTextDocument(vscode.Uri.file(target));
            await vscode.window.showTextDocument(output);
            await vscode.window.showInformationMessage(`DevLingo: ${path.basename(target)} created successfully.`);
        });
    } catch (error) {
        await vscode.window.showErrorMessage(translationErrorMessage(error, 'DevLingo: Unable to translate the Markdown file.'));
    }
}

async function confirmReplacement(target: string): Promise<boolean> {
    if (vscode.workspace.textDocuments.some(item => item.uri.fsPath === target && item.isDirty)) {
        await vscode.window.showWarningMessage('DevLingo: Save or close the unsaved translated file before replacing it.');
        return false;
    }
    return await vscode.window.showWarningMessage(
        `DevLingo: ${path.basename(target)} already exists. Replace it?`,
        { modal: true }, 'Replace', 'Cancel',
    ) === 'Replace';
}

function hasCode(error: unknown, code: string): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

async function aliasesOriginal(source: string, target: string): Promise<boolean> {
    try {
        const [originalPath, translatedPath] = await Promise.all([fs.realpath(source), fs.realpath(target)]);
        return originalPath === translatedPath;
    } catch (error) {
        if (hasCode(error, 'ENOENT')) {
            return false;
        }
        throw error;
    }
}
