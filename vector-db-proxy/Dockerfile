FROM rust
ARG RELEASE
WORKDIR /usr/local/src/vector-db-proxy
RUN mkdir -p src
COPY src/dummy.rs src
COPY Cargo.toml .
COPY Cargo.lock .
RUN sed -i 's#src/main.rs#src/dummy.rs#' Cargo.toml
RUN if [ "$RELEASE" = "true" ] ; then echo "Running Release..." && cargo build --release ; else echo "Running Debug.." && cargo build; fi
RUN sed -i 's#src/dummy.rs#src/main.rs#' Cargo.toml
COPY . .
RUN if [ "$RELEASE" = "true" ] ; then echo "Running Release..." && cargo build --release ; else echo "Running Debug.." && cargo build; fi

RUN mkdir /onnxruntime \
	&& cd /onnxruntime \
	&& wget https://github.com/microsoft/onnxruntime/releases/download/v1.17.1/onnxruntime-linux-x64-1.17.1.tgz \
	&& tar -xvf onnxruntime-linux-x64-1.17.1.tgz \
	&& cd onnxruntime-linux-x64-1.17.1 \
	&& cp lib/libonnxruntime.so.1.17.1 /lib \
	&& cp lib/libonnxruntime.so.1.17.1 /usr/lib

EXPOSE 8001
CMD sh -c 'if [ $RELEASE = "true" ]; then echo "Running release.." && ./target/release/vector-db-proxy; else echo "Running Debug" && ./target/debug/vector-db-proxy; fi'
