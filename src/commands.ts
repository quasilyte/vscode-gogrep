import * as vscode from 'vscode';
import * as path from 'path';
import * as gogrep from './gogrep';
import * as install from './install';

var context : vscode.ExtensionContext;

export function setContext(ctx: vscode.ExtensionContext) {
    context = ctx;
}

// Used as the initial input value for the pattern prompt.
// Updated after every search pattern prompt.
var lastSearchPattern = '';

async function runSearch(target: string, workdir: string, filename: string) {
    let searchPattern = '';
    // Pattern source 1: cursor selection.
    // Performs a "find similar" search.
    if (vscode.window.activeTextEditor) {
        const ed = vscode.window.activeTextEditor;
        const selectionText = ed.document.getText(ed.selection);
        if (selectionText) {
            searchPattern = selectionText;
        }
    }
    // Pattern source 2: direct user input.
    if (!searchPattern) {
        const userInput = await vscode.window.showInputBox({
            value: lastSearchPattern,
            valueSelection: [lastSearchPattern.length, lastSearchPattern.length],
            password: false,
            prompt: "Search pattern"
        });
        if (userInput) {
            searchPattern = userInput;
            lastSearchPattern = userInput;
        }
    }
    if (!searchPattern) {
        return;
    }

    // There are 3 kinds of search patterns:
    // 1. Search-and-replace pattern when pattern contains '->'.
    // 2. If search-and-replace pattern ends with '!', inplace is set to true.
    // 3. Otherwise it's a simple search-only pattern.
    let replacePattern = '';
    let inplace = false;
    if (searchPattern.includes("->")) {
        const parts = searchPattern.split("->");
        if (parts.length > 2) {
            vscode.window.showWarningMessage("Expected at most one '->' token");
            return;
        }
        searchPattern = parts[0].trim();
        replacePattern = parts[1].trim();
        if (replacePattern.endsWith("!")) {
            replacePattern = replacePattern.slice(0, -1); // rtrim "!"
            inplace = true;
        }
    }
    if (filename !== "" && inplace) {
        // Since we're doing a client-side output filtering in a single file mode,
        // it's not safe to run gogrep with -w param as
        // it will update all package files, not just the selected one.
        //
        // See https://github.com/mvdan/gogrep/issues/56.
        vscode.window.showWarningMessage("In-place replace for a single file is not implemented yet");
        return;
    }

    const cfg = vscode.workspace.getConfiguration('gogrep');
    const gogrepPath = cfg.get<string>('binary');
    if (!gogrepPath) {
        vscode.window.showWarningMessage("Invalid or empty gogrep.binary config value");
        return;
    }
    const goConfig = vscode.workspace.getConfiguration('go');
    const gopath = goConfig ? goConfig.get<string>('gopath') : "";

    try {
        await gogrep.runSearch({
            target: target,
            search: searchPattern,
            replace: replacePattern,
            inplace: inplace,
            binary: gogrepPath,
            workdir: workdir,
            gopath: gopath || "",
            lineFilter: filename,
        });
    } catch (e) {
        console.error(e);
        if (e instanceof Error && e.message.includes('ENOENT')) {
            vscode.window.showErrorMessage(`${gogrepPath} not found in PATH`);
            install.fixMissingTool(context);
        }
    }
}

export async function searchFileCommand() {
    const currentPath = vscode.window.activeTextEditor?.document.uri.fsPath;
    if (!currentPath) {
        vscode.window.showWarningMessage("Can't determine file path");
        return;
    }

    runSearch('.', path.dirname(currentPath), currentPath);
}

export async function searchRelativeRecurCommand() {
    const currentPath = vscode.window.activeTextEditor?.document.uri.fsPath;
    if (!currentPath) {
        vscode.window.showWarningMessage("Can't determine current directory path");
        return;
    }

    runSearch('./...', path.dirname(currentPath), "");
}

export async function searchRootRecurCommand() {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showWarningMessage("Can't run root search outside of the workspace");
        return;
    }
    const searchTarget = vscode.workspace.workspaceFolders[0];
    if (!searchTarget) {
        vscode.window.showWarningMessage("Can't determine search root folder");
        return;
    }

    runSearch('./...', searchTarget.uri.fsPath, "");
}