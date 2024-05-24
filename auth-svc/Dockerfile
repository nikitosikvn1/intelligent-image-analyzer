# syntax=docker/dockerfile:1

FROM node:20-alpine

# Use production node environment by default.
ENV NODE_ENV production

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev
RUN npm install -g @nestjs/cli

# Copy the rest of the source files into the image.
COPY . .

# Run the application.
CMD npm run start
