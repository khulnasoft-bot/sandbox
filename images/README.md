# Khulnasoft Managed Images

Dockerfiles for Khulnasoft Managed Images published to Khulnasoft Container Registry (KCR) under
`khulnasoft/sandbox/*`.

| Image                                            | Base                    | Contents                                                  |
| ------------------------------------------------ | ----------------------- | --------------------------------------------------------- |
| [`khulnasoft/sandbox/universal:latest`](./universal) | `khulnasoft/sandbox/ubuntu` | Node.js LTS (24), Python (3.14), coding agents, utilities |
| [`khulnasoft/sandbox/node:22\|24\|26`](./node)       | `khulnasoft/sandbox/ubuntu` | Node.js (major pinned), pnpm                              |
| [`khulnasoft/sandbox/python:3.14`](./python)         | `khulnasoft/sandbox/ubuntu` | Python 3.14 (pinned), pip, venv, uv                       |
| [`khulnasoft/sandbox/arch:latest`](./arch)           | `archlinux:latest`      | Arch Linux, yay (AUR), base-devel, git                    |
| [`khulnasoft/sandbox/ubuntu:latest`](./ubuntu)       | `ubuntu:26.04`          | Ubuntu + sudo                                             |
| [`khulnasoft/sandbox/node:al-22\|24\|26`](./al-node) | `al-base`               | Node.js (major pinned), pnpm                              |
| [`khulnasoft/sandbox/python:al-3.13.1`](./al-python) | `al-base`               | Python 3.13.1, pip, venv, uv                              |

All images are built for `linux/amd64`.

## Building locally

```sh
cd images

# Build all images
docker buildx bake

# Build a single image
docker buildx bake node-24
docker buildx bake universal
```
