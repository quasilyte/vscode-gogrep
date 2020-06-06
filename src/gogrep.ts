import * as vscode from 'vscode';
import child_process = require('child_process');

let outputChan = vscode.window.createOutputChannel('gogrep');

export interface SearchOptions {
    // Package or a filename to be searched.
    target: string;

    // If non-empty, specifies a directory from which
    // gogrep should be executed.
    workdir: string;

    // If non-empty, used to skip output lines that
    // do not contain the lineFilter as a substrings.
    lineFilter: string;

    // If non-empty, used to override process.env GOPATH value.
    gopath: string;

    // gogrep search pattern to execute.
    search: string;

    // gogrep replacement pattern to be applied.
    replace: string;

    // Whether the replacement should be written to the source files.
    inplace: boolean;

    // gogrep binary path.
    binary: string;
}

export function runSearch(opts: SearchOptions): Promise<void> {
    return new Promise((resolve, reject) => {
        // 1. Spawn gogrep process.

        let gogrepEnv = process.env;
        if (opts.gopath !== "") {
            const envCopy : any = {...process.env};
            envCopy['GOPATH'] = opts.gopath;
            gogrepEnv = envCopy;
        }

        const spawnOpts : child_process.SpawnOptionsWithoutStdio = {
            env: gogrepEnv,
        };
        if (opts.workdir !== "") {
            spawnOpts.cwd = opts.workdir;
        }
        const args = [
            '-tests', // Probably needs some control via configuraion
            '-x', opts.search,
        ];
        if (opts.replace !== "") {
            args.push('-s', opts.replace);
        }
        if (opts.inplace) {
            args.push('-w');
        }
        args.push(opts.target);
        console.debug(`${opts.binary} ${args.join(' ')}`);
        const gogrep = child_process.spawn(opts.binary, args, spawnOpts);

        // 2. Handle gogrep output by printing it to the output channel.

        if (opts.replace !== "") {
            let message = `info: search \`${opts.search}\`, replace with \`${opts.replace}\``;
            if (opts.inplace) {
                message += " (inplace)";
            }
            outputChan.appendLine(message);
        } else {
            outputChan.appendLine(`info: search \`${opts.search}\``);

        }

        // Add gogrep output to the channel.
        const filter = opts.lineFilter;
        gogrep.stderr.on('data', (data: Buffer) => {
            outputChan.append(data.toString());
        });
        gogrep.stdout.on('data', (data: Buffer) => {
            if (filter !== "") {
                for (const line of data.toString().split("\n")) {
                    if (line.includes(filter)) {
                        outputChan.appendLine(line);
                    }
                }
            } else {
                outputChan.append(data.toString());
            }
        });

        gogrep.on('exit', (code) => {
            // Exit codes are taken from the gogrep sources.
            if (code === 0) {
                outputChan.appendLine(`info: gogrep finished successfully`);
            } else {
                outputChan.appendLine(`info: gogrep finished with error`);
            }
            outputChan.show();
            resolve();
        });

        gogrep.on('error', (err) => {
            outputChan.appendLine(`error: ${err.message}`);
            outputChan.show();
            reject(err);
        });
    });
}