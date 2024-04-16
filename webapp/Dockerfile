# First Stage: Build
FROM node:latest as builder

WORKDIR /app

# Copy package.json and package-lock.json for npm install
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of your application code
COPY . .

# Disable Next.js telemetry and build the application
RUN npx next telemetry disable && npm run build

# Second Stage: Runtime
FROM node:latest

WORKDIR /app

# Set NODE_ENV environment variable
ENV NODE_ENV production

# Copy only the necessary files from the builder stage
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/next.config.js ./
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/tsconfig.json ./tsconfig.json
# COPY --from=builder /app/tsconfig.server.json ./tsconfig.json
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/package.json ./package.json

COPY --from=builder /app ./

# ARGs for environment variables that need to be passed at build time
ARG SHORT_COMMIT_HASH
ARG POSTHOG_KEY
ARG NEXT_PUBLIC_NO_PAYMENT_REQUIRED
ARG NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH
ARG NEXT_PUBLIC_ENABLE_GITHUB_OAUTH
ARG NEXT_PUBLIC_GCS_BUCKET_NAME
ARG GOOGLE_KEYPATH

# Set environment variables based on ARGs
ENV NEXT_PUBLIC_SHORT_COMMIT_HASH=$SHORT_COMMIT_HASH \
    NEXT_PUBLIC_POSTHOG_KEY=$POSTHOG_KEY \
    NEXT_PUBLIC_NO_PAYMENT_REQUIRED=$NEXT_PUBLIC_NO_PAYMENT_REQUIRED \
    NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH=$NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH \
    NEXT_PUBLIC_ENABLE_GITHUB_OAUTH=$NEXT_PUBLIC_ENABLE_GITHUB_OAUTH \
    NEXT_PUBLIC_GCS_BUCKET_NAME=$NEXT_PUBLIC_GCS_BUCKET_NAME \
    GOOGLE_APPLICATION_CREDENTIALS=/app/keyfile.json

# Copy the Google credentials file from the build context
COPY $GOOGLE_KEYPATH /app/keyfile.json

# Expose the port the app runs on
EXPOSE 3000

# Command to run your app
CMD ["npm", "run", "start"]
