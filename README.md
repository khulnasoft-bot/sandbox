# Khulnasoft Sandbox

Khulnasoft Sandbox allows you to run arbitrary code in isolated, ephemeral Linux
VMs. View the documentation [here](https://khulnasoft.com/docs/khulbasoft-sandbox).

## Packages

- [`@khulnasoft/sandbox`](https://www.npmjs.com/package/@khulnasoft/sandbox) - The SDK for programmatic access to Khulnasoft Sandbox. [Source](https://github.com/khulnasoft/sandbox/tree/main/packages/khulbasoft-sandbox) | [Documentation](https://khulnasoft.com/docs/khulbasoft-sandbox/sdk-reference)
- [`sandbox`](https://www.npmjs.com/package/sandbox) - The CLI for interacting with Khulnasoft Sandbox from the command line. [Source](https://github.com/khulnasoft/sandbox/tree/main/packages/sandbox) | [Documentation](https://khulnasoft.com/docs/khulbasoft-sandbox/cli-reference)

## What is a sandbox?

A sandbox is an isolated Linux system for your experimentation and use.
Internally, it is a Firecracker MicroVM that is powered by [the same
infrastructure][hive] that powers 2M+ builds a day at Khulnasoft.

## Getting started

To get started using Ubuntu with Node.js 24, create a new project:

```sh
mkdir my-sandbox-app && cd my-sandbox-app
npm init -y
khulnasoft link
```

Pull your authentication token:

```sh
khulnasoft env pull
```

Install the Sandbox SDK:

```sh
pnpm i @khulnasoft/sandbox
```

Install the Sandbox Skill:

```sh
npx skills add khulnasoft/sandbox
```

Create a `index.mts` file:

```ts
import { Sandbox } from "@khulnasoft/sandbox";
import { setTimeout } from "timers/promises";
import { spawn } from "child_process";

async function main() {
  const sandbox = await Sandbox.create({
    source: {
      url: "https://github.com/khulnasoft/sandbox-example-next.git",
      type: "git",
    },
    resources: { vcpus: 4 },
    ports: [3000],
  });

  console.log(`Installing dependencies...`);
  const install = await sandbox.runCommand({
    cmd: "npm",
    args: ["install", "--loglevel", "info"],
    cwd: "sandbox-example-next",
    stderr: process.stderr,
    stdout: process.stdout,
  });

  if (install.exitCode != 0) {
    console.log("installing packages failed");
    process.exit(1);
  }

  console.log(`Starting the development server...`);
  await sandbox.runCommand({
    cmd: "npm",
    args: ["run", "dev"],
    cwd: "sandbox-example-next",
    stderr: process.stderr,
    stdout: process.stdout,
    detached: true,
  });

  await setTimeout(500);
  spawn("open", [sandbox.domain(3000)]);
}

main().catch(console.error);
```

Run it:

```sh
node --experimental-strip-types --env-file .env.local index.mts
```

This will:

- Start a sandbox, seeding it with a git repository.
- Install dependencies.
- Run a `next dev` server
- Open it in your browser

All while streaming logs to your local terminal.

## Authentication

### Khulnasoft OIDC token

The SDK uses Khulnasoft OIDC tokens to authenticate whenever available. This is the
most straightforward and recommended way to authenticate.

When developing locally, you can download a development token to `.env.local`
using `khulnasoft env pull`. After 12 hours the development token expires, meaning
you will have to call `khulnasoft env pull` again.

In production, Khulnasoft manages token expiration for you.

### Access token

If you want to use the SDK from an environment where `KHULNASOFT_OIDC_TOKEN` is
unavailable, you can also authenticate using an access token:

- Go to your team settings, and copy the team ID.
- Go to a project's settings, and copy the project ID.
- Go to your Khulnasoft account settings and [create a token][create-token]. Make
  sure it is scoped to the team ID from the previous step.

Set your team ID, project ID, and token to the environment variables
`KHULNASOFT_TEAM_ID`, `KHULNASOFT_PROJECT_ID`, and `KHULNASOFT_TOKEN`. Then pass these to
the `create` method:

```ts
const sandbox = await Sandbox.create({
  teamId: process.env.KHULNASOFT_TEAM_ID!,
  projectId: process.env.KHULNASOFT_PROJECT_ID!,
  token: process.env.KHULNASOFT_TOKEN!,
  source: {
    url: "https://github.com/khulnasoft/sandbox-example-next.git",
    type: "git",
  },
  resources: { vcpus: 4 },
  // Defaults to 5 minutes. The maximum is 24 hours for Pro/Enterprise, and 45 minutes for Hobby.
  timeout: ms("5m"),
  ports: [3000],
});
```

## Workflow DevKit integration

`Sandbox` and `CommandFinished` support serialization with the
[Workflow DevKit](https://khulnasoft.com/docs/workflow). When a sandbox instance
crosses a step boundary the SDK serializes sandbox metadata and routes, then
rehydrates synchronously from that snapshot. Deserialized instances lazily
recreate an API client using OIDC or environment credentials when needed.

## Limitations

- Max resources: 8 vCPUs on Hobby/Pro, 32 vCPUs on Enterprise. You will get 2048 MB of memory per vCPU.
- Sandboxes have a maximum duration of 24 hours for Pro/Enterprise and 45 minutes for Hobby,
  with a default of 5 minutes. This can be configured using the `timeout` option of `Sandbox.create()`.

## Sudo access

The default image allows users to run commands as root. This can be used to
install packages and system tools:

```typescript
import { Sandbox } from "@khulnasoft/sandbox";

const sandbox = await Sandbox.create();
await sandbox.runCommand({
  cmd: "apt-get",
  args: ["update"],
  sudo: true,
});
await sandbox.runCommand({
  cmd: "apt-get",
  args: ["install", "-y", "golang-go"],
  sudo: true,
});
```

Sandbox runs sudo in the following configuration:

- `HOME` is set to `/root` – Executed commands will source root's configuration
  files (e.g. `.gitconfig`, `.bashrc`, etc).
- Environment variables are not reset before executing the command.
- `PATH` is left unchanged – sudo won't change the value of PATH, so local or
  project-specific binaries will still be found.

[create-token]: https://khulnasoft.com/account/settings/tokens
[hive]: https://khulnasoft.com/blog/a-deep-dive-into-hive-khulnasofts-builds-infrastructure
[kcr-docs]: https://khulnasoft.com/docs/container-registry
[images-docs]: https://khulnasoft.com/docs/sandbox/concepts/images

The skill provides comprehensive guidance on using the `@khulnasoft/sandbox` SDK, including code patterns, best practices, and API reference.

## Default image

Sandboxes use [`khulnasoft/sandbox/universal:latest`](./images/universal) by
default. This Ubuntu-based image includes Node.js 24, Bun, Python 3.14, coding
agents, and common development and debugging utilities. It runs as the
`ubuntu` user with passwordless sudo.

## Khulnasoft Managed Images

Khulnasoft provides several public images optimized to use in Sandbox.
The Dockerfiles for Khulnasoft Managed Images published under `khulnasoft/sandbox/*` live in [`images/`](https://github.com/khulnasoft/sandbox/tree/main/images):

- [`khulnasoft/sandbox/universal:latest`](./images/universal): Default image with Node.js, Python, coding agents, and utilities.
- [`khulnasoft/sandbox/node:22|24|26`](./images/node): Node.js with pnpm.
- [`khulnasoft/sandbox/python:3.14`](./images/python): Python with pip, venv, and uv.
- [`khulnasoft/sandbox/ubuntu:latest`](./images/ubuntu): Minimal Ubuntu base.
- [`khulnasoft/sandbox/arch:latest`](./images/arch): Arch Linux with yay/AUR support.

See the [images README](https://github.com/khulnasoft/sandbox/tree/main/images#readme)
for build instructions.

### Custom images

A sandbox can boot from any OCI image by pushing it to
[Khulnasoft Container Registry (KCR)][kcr-docs] and passing `image` to
`Sandbox.create()`.

Build and push a `linux/amd64` image to KCR:

```sh
khulnasoft kcr login docker
khulnasoft kcr build docker . my-repository:latest --push
```

The CLI uses the linked project, defaults to `linux/amd64`, and constructs the
full KCR reference automatically.

KCR implements the Docker Registry API, so any OCI compatible tooling can also be used, such as `buildah` or `podman`.

Then start a sandbox from it:

```ts
const sandbox = await Sandbox.create({
  image: "my-repository:latest",
});
```

See the [images documentation][images-docs] for more details.

## Authors

This library is created by [Khulnasoft](https://khulnasoft.com) team members, with contributions from the [Open Source Community](https://github.com/khulnasoft/sandbox/graphs/contributors) welcome and highly appreciated.
