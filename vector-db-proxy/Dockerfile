FROM rust:1.78.0 as builder
ARG RELEASE
WORKDIR /usr/local/src/vector-db-proxy
RUN mkdir -p src
COPY src/dummy.rs src
COPY Cargo.toml .
COPY Cargo.lock .
RUN sed -i 's#src/main.rs#src/dummy.rs#' Cargo.toml

RUN apt-get update -y && apt-get install -y iputils-ping htop

RUN if [ "$RELEASE" = "true" ] ; then echo "Running Release..." \
	&& cargo build --release \
	&& mkdir -p /usr/local/src/vector-db-proxy/target/debug \
	&& touch /usr/local/src/vector-db-proxytarget/debug/vector-db-proxy ; else echo "Running Debug.." \
	&& cargo build  \
	&& mkdir -p /usr/local/src/vector-db-proxy/target/release \
	&& touch /usr/local/src/vector-db-proxy/target/release/vector-db-proxy ; fi

RUN sed -i 's#src/dummy.rs#src/main.rs#' Cargo.toml

#TODO: only copy whats necessary
COPY . . 

RUN if [ "$RELEASE" = "true" ] ; then echo "Running Release..." \
	&& cargo build --release \
	&& mkdir -p /usr/local/src/vector-db-proxy/target/debug \
	&& touch /usr/local/src/vector-db-proxytarget/debug/vector-db-proxy ; else echo "Running Debug.." \
	&& cargo build  \
	&& mkdir -p /usr/local/src/vector-db-proxy/target/release \
	&& touch /usr/local/src/vector-db-proxy/target/release/vector-db-proxy ; fi

RUN mkdir /onnxruntime \
	&& cd /onnxruntime \
	&& wget https://github.com/microsoft/onnxruntime/releases/download/v1.17.1/onnxruntime-linux-x64-1.17.1.tgz \
	&& tar -xvf onnxruntime-linux-x64-1.17.1.tgz \
	&& cd onnxruntime-linux-x64-1.17.1 \
	&& cp lib/libonnxruntime.so.1.17.1 /lib \
	&& cp lib/libonnxruntime.so.1.17.1 /usr/lib

# Final Stage (using rust image to be safe so we have important libs like libssl, etc)
FROM rust:1.77.2
WORKDIR /app
# Set arguments
ARG RELEASE
ARG UNSTRUCTURED_API_KEY
ARG UNSTRUCTURED_API_URL
ARG PINECONE_API_KEY
# Set ENV variables
ENV IS_RELEASE=$RELEASE
ENV UNSTRUCTURED_API_URL=$UNSTRUCTURED_API_URL
ENV UNSTRUCTURED_API_KEY=$UNSTRUCTURED_API_KEY
ENV PINECONE_API_KEY=$PINECONE_API_KEY
# Copy from builder step
COPY --from=builder /usr/local/src/vector-db-proxy/target/release/vector-db-proxy /app/vector-db-proxy-release
COPY --from=builder /usr/local/src/vector-db-proxy/target/debug/vector-db-proxy /app/vector-db-proxy-debug
# Only copy runtime dependencies if necessary
COPY --from=builder /lib/libonnxruntime.so.1.17.1 /lib/
COPY --from=builder /usr/lib/libonnxruntime.so.1.17.1 /usr/lib/
EXPOSE 8001
CMD sh -c 'if [ "$IS_RELEASE" = "true" ]; then ./vector-db-proxy-release; else ./vector-db-proxy-debug; fi'
