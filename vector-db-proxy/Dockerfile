FROM rust
WORKDIR /usr/local/src/vector-db-proxy
ARG GOOGLE_KEYPATH
COPY $GOOGLE_KEYPATH keyfile.json
ENV GOOGLE_APPLICATION_CREDENTIALS=/usr/local/src/vector-db-proxy/keyfile.json
RUN mkdir -p src
COPY src/dummy.rs src
COPY Cargo.toml .
COPY Cargo.lock .
RUN sed -i 's#src/main.rs#src/dummy.rs#' Cargo.toml
RUN cargo build --release
RUN sed -i 's#src/dummy.rs#src/main.rs#' Cargo.toml
COPY . .
RUN cargo build --release

# TODO: make this work for all architectures
RUN mkdir /onnxruntime \
	&& cd /onnxruntime \
	&& wget https://github.com/microsoft/onnxruntime/releases/download/v1.17.1/onnxruntime-linux-x64-1.17.1.tgz \
	&& tar -xvf onnxruntime-linux-x64-1.17.1.tgz \
	&& cd onnxruntime-linux-x64-1.17.1 \
	&& cp lib/libonnxruntime.so.1.17.1 /lib \
	&& cp lib/libonnxruntime.so.1.17.1 /usr/lib

EXPOSE 8001
CMD ["target/release/vector-db-proxy"]
