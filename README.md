[![Version](https://vsmarketplacebadge.apphb.com/version-short/quasilyte.gogrep.svg)](https://marketplace.visualstudio.com/items?itemName=quasilyte.gogrep)
[![Installs](https://vsmarketplacebadge.apphb.com/downloads-short/quasilyte.gogrep.svg)](https://marketplace.visualstudio.com/items?itemName=quasilyte.gogrep)

# gogrep for [Visual Studio Code](https://code.visualstudio.com/)

Search for Go code using AST patterns. Uses [github.com/mvdan/gogrep](https://github.com/mvdan/gogrep) tool under the hood.

## Features

* Search Go code using smart matching instead of regexps
* Find similar code fragments
* AST-based replace for quick and precise refactoring
* Advanced search filters (**to be implemented**)

If you have a feature request (or a bug report), consider [to open the issue on the GitHub](https://github.com/quasilyte/vscode-gogrep/issues/new).

## Overview

This extension exposes `gogrep` search commands (`Ctrl+Shift+P`).

![](/docs/commands.jpg "Ctrl+Shift+P gogrep")

Every command creates a search pattern prompt.

![](/docs/pattern.jpg "search pattern prompt")
  
Search results are printed to the **output channel** named `gogrep`.

![](/docs/output.jpg "gogrep output channel")

The pattern language syntax is extended Go syntax. Variables with `$` prefix have special meaning.

> A pattern is a piece of Go code which may include dollar expressions. It can be
a number of statements, a number of expressions, a declaration, or an entire
file. A dollar expression consists of '$' and a name. Dollar expressions with the same
name within a query always match the same node, excluding "_".

Instead of matching a literal variable, every `$<name>` matches all kinds of nodes. A pattern, like `$x` would match any expression (or statement). If a single variable used more than once in a pattern, all occurrences must match identical nodes. So, `$x=$x` finds all self-assignments. Use `$_` if you don't want to name a variable (repeated `$_` variables do not cause submatch comparison).

Some example search patterns:

* `+$x` - find usages of unary plus operator
* `strings.Replace($_, $_, $_, -1)` - find places where `strings.ReplaceAll` can be used
* `$x != $_ || $x != $y` - find || operators where comparison with `$y` may be redundant
* `copy($x, $x)` - find `copy` calls where `dst` and `src` arguments are identical
* `$x = $x + 1` - find all statements that can be written as `$x++`
* `map[$_]$_{$*_, $k: $_, $*_, $k: $_, $*_}` - find maps with at least 1 duplicated key
* `len($_) >= 0` - find sloppy length checks (this one is always true)
* `json.NewDecoder($_).Decode($_)` - find [potentially erroneous](http://golang.org/issue/36225) usages of JSON decoder

To run **find similar** query, run any main search command (e.g. `gogrep.searchFile`) with non-empty **selection**. The **selected text** will be used as a search pattern.

To perform a **search-and-replace**, use `$find -> $replace` pattern syntax. Both `$find` and `$replace` are normal `gogrep` patterns. To write changes back to the source files, end pattern with `!`. So, `$x+=1 -> $x++ !` replaces all `$x += 1` statements with `$x++`. If `!` is omitted, replacements are printed to the output channel.

![](/docs/replace.jpg "Search-and-replace (inplace)")

Additional learning resources:
*  Although somewhat old, there is a [Daniel Martí talk on gogrep](https://talks.godoc.org/github.com/mvdan/talks/2018/gogrep.slide).
* `gogrep` tutorial articles are available in [English](https://quasilyte.dev/blog/post/gogrep/) and [Russian](https://habr.com/ru/post/505652/).

## Demo

Running `$x = append($x, $_); $x = append($x, $_)` pattern that finds consecutive appends to the same slice:

![](/docs/demo.gif)

Doing a search-and-replace for with `$x+=1 -> $x++ !` pattern:

![](/docs/replace-demo.gif)

## Extension Settings

* `gogrep.binary`: [gogrep](https://github.com/mvdan/gogrep) binary path (default `"gogrep"`)
* `gogrep.gopath`: whether to set gogrep process `GOPATH` to `go.gopath` (default `false`)

By default, we rely on Go modules. If it's not working for you, it's possible to try the `GOPATH` approach. To do that, set `gogrep.gopath` option to `true`. It will use the Go mode `go.gopath` config value to set the spawned `gogrep` process `GOPATH` environment variable.

## Requirements

* [gogrep](https://github.com/mvdan/gogrep) binary

Note that this extension usually comes with precompiled binaries for some platforms. If there is no binary for your platform, you'll have to build `gogrep` from the source.

Optional/recommended:
* [Output Colorizer](https://marketplace.visualstudio.com/items?itemName=IBM.output-colorizer) to make the output colorized

## Contributing

The easiest, though a very good way to contribute and show gratitude is to put a ⭐️ to<br>
[mvdan/gogrep](https://github.com/mvdan/gogrep) and [quasilyte/vscode-gogrep](https://github.com/quasilyte/vscode-gogrep). :)

Contributions can be made to either of the referenced projects. PRs, bug reports, and feature requests are welcome.
