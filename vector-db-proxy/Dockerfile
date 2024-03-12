FROM rust
WORKDIR /usr/local/src/vector-db-proxy
ARG GOOGLE_KEYPATH
COPY $GOOGLE_KEYPATH keyfile.json
ENV GOOGLE_APPLICATION_CREDENTIALS=/usr/local/src/vector-db-proxy/keyfile.json
RUN mkdir -p src
COPY src/dummy.rs src
COPY Cargo.toml .
RUN sed -i 's#src/main.rs#src/dummy.rs#' Cargo.toml
RUN cargo build --release
RUN sed -i 's#src/dummy.rs#src/main.rs#' Cargo.toml
COPY . .
RUN cargo build --release
EXPOSE 8001
CMD ["target/release/vector-db-proxy"]
