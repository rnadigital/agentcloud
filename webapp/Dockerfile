FROM node:latest

WORKDIR /app
ENV NODE_ENV production

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm install

COPY . /app
RUN touch /app/.env

ARG SHORT_COMMIT_HASH
ENV NEXT_PUBLIC_SHORT_COMMIT_HASH=$SHORT_COMMIT_HASH

ARG GOOGLE_KEYPATH
COPY $GOOGLE_KEYPATH /app/keyfile.json
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/keyfile.json

RUN npx next telemetry disable
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
