[![Version](https://vsmarketplacebadge.apphb.com/version-short/quasilyte.gogrep.svg)](https://marketplace.visualstudio.com/items?itemName=quasilyte.gogrep)
[![Installs](https://vsmarketplacebadge.apphb.com/downloads-short/quasilyte.gogrep.svg)](https://marketplace.visualstudio.com/items?itemName=quasilyte.gogrep)

# gogrep for [Visual Studio Code](https://code.visualstudio.com/)

Search for Go code using AST patterns. Uses [github.com/mvdan/gogrep](https://github.com/mvdan/gogrep) tool under the hood.

## Features

* Search Go code using smart matching instead of regexps
* Find similar code fragments
* AST-based replace for quick and precise refactoring (**to be implemented**)
* Advanced search filters (**to be implemented**)

## Overview

This extension exposes `gogrep` search commands.

![](/docs/commands.jpg "Ctrl+Shift+P gogrep")

Every command creates a search pattern prompt.

![](/docs/pattern.jpg "search pattern prompt")
  
Search results are printed to the **output channel** named `gogrep`.

![](/docs/output.jpg "gogrep output channel")

The pattern language syntax is extended Go syntax. Variables with `$` prefix have special meaning.

Instead of matching a literal variable, every `$<name>` matches all kinds of nodes. A pattern, like `$x` would match any expression (or statement). If a single variable used more than once in a pattern, all occurrences must match identical nodes. So, `$x=$x` finds all self-assignments. Use `$_` if you don't want to name a variable (repeated `$_` variables do not cause submatch comparison).

Advanced queries may include special variable nodes: `foo(nil, $*_)` finds all `foo` function calls where the first argument is `nil` and all other arguments are ignored.

Some example search patterns:

* `+$x` - find usages of unary plus operator
* `strings.Replace($_, $_, $_, -1)` - find places where `strings.ReplaceAll` can be used
* `$x != $_ || $x != $y` - find || operators where comparison with `$y` may be redundant
* `copy($x, $x)` - find `copy` calls where `dst` and `src` arguments are identical
* `$x = $x + 1` - find all statements that can be written as `$x++`
* `map[$_]$_{$*_, $k: $_, $*_, $k: $_, $*_}` - find maps with at least 1 duplicated key
* `len($_) >= 0` - find sloppy length checks (this one is always true)
* `json.NewDecoder($_).Decode($_)` - find [potentially erroneous](http://golang.org/issue/36225) usages of JSON decoder

To run "find similar" query, run any main search command (e.g. `gogrep.searchFile`) with non-empty selection. The selected text will be used as a search pattern.

Another useful source of inspiration and [examples](https://github.com/quasilyte/go-ruleguard/blob/master/rules.go) is [go-ruleguard](https://github.com/quasilyte/go-ruleguard) project that uses `gogrep` for linting purposes.

## Demo

Running `$x = $x + 1` pattern that finds candidates for `$x++` refactoring:

![](/docs/demo1.gif)

Running `if ($cond) { $x } else { $x }` pattern that finds if statements with duplicated then/else bodies:

![](/docs/demo2.gif)

## Extension Settings

* `gogrep.binary`: [gogrep](https://github.com/mvdan/gogrep) binary path (default `"gogrep"`)

## Requirements

* [gogrep](https://github.com/mvdan/gogrep) binary

Note that this extension usually comes with precompiled binaries for some platforms. If there is no binary for your platform, you'll have to build `gogrep` from the source.

Optional/recommended:
* [Output Colorizer](https://marketplace.visualstudio.com/items?itemName=IBM.output-colorizer) to make the output colorized
