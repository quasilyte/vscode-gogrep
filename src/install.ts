import * as vscode from 'vscode';
import zlib = require('zlib');
import { promises as fs } from 'fs';

var triedToInstall = false;

export async function fixMissingTool(ctx: vscode.ExtensionContext) {
    if (triedToInstall) {
        return;
    }
    triedToInstall = true;

    if (installFromPrebuilt(ctx)) {
        return;
    }

    // TODO: try to install using `go get`?
}

const prebuilt = {
    'linux-amd64': true,
    'windows-amd64': true,
    'darwin-amd64': true,
};

async function installFromPrebuilt(ctx: vscode.ExtensionContext) {
    const key = platformKey();
    if (!(key in prebuilt)) {
        return false;
    }

    const archivePath = `${ctx.extensionPath}/binaries/gogrep-${key}.gz`;
    let binaryPath = `${ctx.extensionPath}/binaries/gogrep-${key}`;
    if (platformGOOS() === "windows") {
        binaryPath += ".exe";
    }

    const zippedData = await fs.readFile(archivePath);
    const data = await gunzip(zippedData);
    await fs.writeFile(binaryPath, data, {mode: 0o775});

    const cfg = vscode.workspace.getConfiguration('gogrep');
    cfg.update('binary', binaryPath).then(
        () => {
            vscode.window.showInformationMessage("installed gogrep, 'gogrep.binary' setting is updated");
        },
    );

    return true;
}

function gunzip(buf: zlib.InputType) {
    return new Promise(function (resolve, reject) {
        zlib.gunzip(buf, function(error: Error|null, result: Buffer) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

function platformKey(): string {
    return platformGOOS() + "-" + platformGOARCH();
}

function platformGOOS(): string {
    const goos = process.platform.toString();
    if (goos === 'win32') {
        return 'windows';
    }
    return goos;
}

function platformGOARCH(): string {
    const goarch = process.arch.toString();
    if (goarch === 'x64') {
        return 'amd64';
    }
    return goarch;
}