import * as vscode from 'vscode';
import { languages } from './languages';

export function getTargetLanguage(): string {
    const configured = vscode.workspace.getConfiguration('devlingo').get<string>('targetLanguage', 'fr');
    return languages.some(language => language.code === configured) ? configured : 'fr';
}
