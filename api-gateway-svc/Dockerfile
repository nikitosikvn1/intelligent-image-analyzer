# syntax=docker/dockerfile:1

FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache protobuf

# Use production node environment by default.
ENV NODE_ENV production

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev
RUN npm install -g @nestjs/cli

# Copy the rest of the source files into the image.
COPY . .

# Generate typescript files from proto files
RUN protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto \
    --ts_proto_out=./ \
    --ts_proto_opt=nestJs=true \
    ./src/gateway-grpc-vision/proto/computer_vision.proto

EXPOSE 3000

# Run the application.
CMD npm run start

