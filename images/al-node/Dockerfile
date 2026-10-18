FROM sandbox-base AS sandbox-node

ARG NODE_ARCH=x64
ARG NODE_MAJOR
ARG NODE_VERSION

RUN mkdir -p /khulnasoft/runtimes/node${NODE_MAJOR} && curl https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-$NODE_ARCH.tar.gz | tar -zx --strip-components=1 -C /khulnasoft/runtimes/node${NODE_MAJOR} && /khulnasoft/runtimes/node${NODE_MAJOR}/bin/node --version
ENV PATH="/khulnasoft/runtimes/node${NODE_MAJOR}/bin:${PATH}"

RUN npm install -g pnpm@10

USER khulbasoft-sandbox

RUN mkdir -p ~/.global/{npm,pnpm} && \
  npm config set prefix ~/.global/npm && \
  pnpm config set global-dir ~/.global/pnpm && \
  pnpm config set global-bin-dir ~/.global/pnpm/bin

ENV PATH="/khulnasoft/runtimes/node${NODE_MAJOR}/bin:/home/khulbasoft-sandbox/.global/pnpm/bin:/home/khulbasoft-sandbox/.global/npm/bin:${PATH}"
