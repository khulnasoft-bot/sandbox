FROM builder-base AS builder-python

ARG PYTHON_VERSION=3.13.1

RUN mkdir -p /khulnasoft/runtimes/python && \
    wget "https://www.python.org/ftp/python/$PYTHON_VERSION/Python-$PYTHON_VERSION.tgz" && \
    tar -xvf "Python-$PYTHON_VERSION.tgz" && \
    cd "Python-$PYTHON_VERSION" && \
    ./configure --enable-optimizations --prefix=/khulnasoft/runtimes/python && \
    make -j "$(nproc)" && \
    make install && \
    cd .. && \
    rm -rf "Python-$PYTHON_VERSION" "Python-$PYTHON_VERSION.tgz"

ENV PATH="/opt/git/bin:/khulnasoft/runtimes/python/bin:/home/khulbasoft-sandbox/.local/bin:/usr/local/bin:${PATH}"

RUN python3 -m pip install --upgrade pip && \
    pip install uv

RUN rm -rf \
  /khulnasoft/runtimes/python/lib/python3.13/test \
  /khulnasoft/runtimes/python/lib/python3.13/__pycache__ \
  /khulnasoft/runtimes/python/lib/python3.13/ensurepip \
  /khulnasoft/runtimes/python/lib/python3.13/idlelib \
  /khulnasoft/runtimes/python/lib/python3.13/tkinter \
  /khulnasoft/runtimes/python/lib/python3.13/distutils \
  /khulnasoft/runtimes/python/lib/pkgconfig \
  /khulnasoft/runtimes/python/share

# Convenience symlink so `python`, `python3` and `python3.13` all work.
RUN ln --relative --symbolic /khulnasoft/runtimes/python/bin/python3 /khulnasoft/runtimes/python/bin/python

FROM sandbox-base AS sandbox-python

# Copy compiled Python and git from builder stage
COPY --from=builder-python /khulnasoft/runtimes/python /khulnasoft/runtimes/python

ENV PATH="/khulnasoft/runtimes/python/bin:${PATH}"

USER khulbasoft-sandbox

RUN python3 --version && \
    pip3 --version && \
    python3 -m venv -h && \
    uv --version
