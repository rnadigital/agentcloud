FROM node:latest

WORKDIR /app
ENV NODE_ENV production

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

RUN npm install

COPY .env /app/.env
COPY . /app

RUN npx next telemetry disable
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
