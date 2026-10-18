# Khulnasoft Sandbox CLI

Khulnasoft Sandbox allows you to run arbitrary code in isolated, ephemeral Linux
VMs. View the documentation [here](https://khulnasoft.com/docs/khulbasoft-sandbox).

## Packages

- [`@khulnasoft/sandbox`](https://www.npmjs.com/package/@khulnasoft/sandbox) - The SDK for programmatic access to Khulnasoft Sandbox. [Source](https://github.com/khulnasoft/sandbox/tree/main/packages/khulbasoft-sandbox) | [Documentation](https://khulnasoft.com/docs/khulbasoft-sandbox/sdk-reference)
- [`sandbox`](https://www.npmjs.com/package/sandbox) (this package) - The CLI for interacting with Khulnasoft Sandbox from the command line. [Source](https://github.com/khulnasoft/sandbox/tree/main/packages/sandbox) | [Documentation](https://khulnasoft.com/docs/khulbasoft-sandbox/cli-reference)

## Installation

```bash
pnpm i -g sandbox
```

## Usage

```bash
sandbox login # If you are not already logged in with the Khulnasoft CLI
sandbox create --connect # Create a new sandbox and open an interactive shell
sandbox ls # List your sandboxes
sandbox --help # View all commands
```

Learn more about the CLI in the [documentation](https://khulnasoft.com/docs/khulbasoft-sandbox/cli-reference).

### Agents

```bash
sandbox create opencode # Create a new sandbox and open OpenCode
sandbox create pi # Create a new sandbox and open Pi
sandbox create claude # Create a new sandbox and open Claude Code
sandbox create codex # Create a new sandbox and open Codex
```
