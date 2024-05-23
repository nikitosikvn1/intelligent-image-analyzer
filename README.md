<div align="center" width="100%">
    <img src="https://i.ibb.co/8dN8rpd/DALL-E-2024-05-22-01-43-41-A-logo-featuring-a-stylized-blue-eye-with-intricate-circular-patterns-of.webp" style="width: 300px;"/>
    <h1>Intelligent Image Analyzer</h1>
        <p style="font-size: 18px;line-height: 1.2;">
            This project aims to provide descriptions of images using computer vision technologies, designed to assist users in automatically obtaining information about images, thereby reducing the need for manual analysis.
    </p>
</div>

## Introduction
The Intelligent Image Analyzer is a microservices-based project developed for image analysis. It is designed to offer scalable, efficient, and robust image processing solutions using modern technologies. The project integrates microservices to handle different aspects of image analysis, ensuring flexibility and ease of maintenance. This document will guide you through the project's architecture, installation process, usage.

## Table of Contents
- [Introduction](#introduction)
- [Architecture](#architecture)
  - [Gateway Service](#gateway-service)
  - [Authentication Service](#authentication-service)
  - [Vision Service](#vision-service)
- [Installation](#installation)
- [Running](#running)
- [Usage](#usage)

## Architecture
The project is composed of several microservices, each responsible for a specific aspect of the overall functionality. This modular approach allows for easy scaling, maintenance, and updates. The main components are:

### Gateway service:
Acts as the entry point for all client requests, routing them to the appropriate microservices.

**Authentication Service Integration**:
  - ***Purpose***: Handle user authentication tasks.
  - ***Implementation***: Utilizes RabbitMQ for secure messaging between the Gateway and Auth services. The Gateway sends user-related requests (registration, login, token validation) to the Auth Service, which processes these requests and manages user data and authentication logic.

**Vision Service Integration**:
  - ***Purpose***: Handle image uploads and retrieve their descriptions.
  - ***Implementation***: Uses gRPC for efficient communication. The Gateway sends image data to the Vision Service, which processes the images and returns the analysis results. This service is configured to ensure secure and fast image processing, leveraging the Vision Service's capabilities.

### Authentication service
Manages user authentication and authorization tasks.

**Gateway Service Integration**:
  - ***Purpose***: Receives authentication-related requests from the Gateway Service and processes them accordingly.
  - ***Implementation***: Utilizes RabbitMQ for secure messaging between the Authentication and Gateway services. RabbitMQ enables reliable communication, ensuring that user authentication requests are handled securely and efficiently.

**Functionality**:
  - ***User Registration***:
    - Handles sign-up requests from clients via the sign-up message pattern.
    - Validates user data using a validation pipe to ensure data integrity.
    - Invokes the signUp method in the AuthService to create a new user account.
    - Returns a response indicating the success or failure of the sign-up operation.

  - ***User Login***:
    - Processes sign-in requests from clients via the sign-in message pattern.
    - Validates user credentials using a validation pipe.
    - Invokes the signIn method in the AuthService to authenticate the user.
    - Returns a response containing JWT tokens upon successful authentication.

  - ***Token Validation***:
    - Handles token validation requests from clients via the validate-token message pattern.
    - Validates JWT tokens provided by clients to ensure their authenticity and integrity.
    - Invokes the validateToken method in the AuthService to perform token validation.
    - Returns a response indicating whether the token is valid or not.

  - ***Token Refresh***:
    - Processes token refresh requests from clients via the refresh-token message pattern.
    - Validates the current JWT token.
    - Invokes the refreshToken method in the AuthService to generate new tokens.
    - Returns a response with the new tokens or an error message if the refresh fails.

### Vision service
Manages image analysis and description generation tasks.

**Gateway Service Integration**:
  - ***Purpose***: Receives image processing requests from the Gateway Service and processes them accordingly.
  - ***Implementation***: Uses gRPC for efficient communication between the Vision Service and the Gateway. The Gateway sends image data to the Vision Service, which processes the images and returns the analysis results.

**Functionality**:
  - ***Image Processing***:
    - ***Single Image***:
      - Handles requests to process a single image via the ProcessImage RPC method.
      - The request includes the image data and the model type to be used for processing.
      - Returns a description of the image.
    - ***Batch Image Processing***:
      - Handles requests to process multiple images via the ProcessImageBatch streaming RPC method.
      - The request stream includes multiple image data entries and model types.
      - Returns a stream of image descriptions.

## Installation
1. Install [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/) on your system.
2. Generate certificates for SSL connection between Gateway and Auth services.
Example of certificates location:
```plaintext
./certs
    ├── ca.key
    ├── ca.pem
    ├── ca.srl
    ├── server_cert.pem
    ├── server_key.pem
    ├── server.csr
    ├── server.key
    ├── server.pem
./api-gateway-svc/cert
    ├── ca.pem
    ├── gateway_cert.pem
    ├── gateway_csr.pem
    ├── gateway_key.pem
./auth-svc/cert
    ├── ca.pem
    ├── auth_cert.pem
    ├── auth_csr.pem
    ├── auth_key.pem
```
3. Set Up Environment Variables:
- Create a `.env` file in the root directory of the project and add the following environment variables:
```env
# RabbitMQ configuration variables
RABBITMQ_DEFAULT_USER=username
RABBITMQ_DEFAULT_PASS=password
RABBITMQ_USER=username
RABBITMQ_PASS=password
RABBITMQ_HOST=rmq-host:port
RABBITMQ_QUEUE=auth_queue_name
RABBITMQ_CERT_PATH=path (for example: "../certs/client.pem")
RABBITMQ_KEY_PATH=path (for example: "../certs/client.key")
RABBITMQ_PASSPHRASE=passphrase
RABBITMQ_CA_PATH=path (for example: "../certs/ca.pem")

# PGSQL configuration variables
DB_HOST=db_host
DB_PORT=db_port
DB_USERNAME=db_username
DB_PASSWORD=db_password
DB_NAME=db_name
```

- Create a `.env` file in the api-gateway-svc directory and add the following environment variables:
```env
# RabbitMQ configuration
RABBITMQ_DEFAULT_USER=username
RABBITMQ_DEFAULT_PASS=password
RABBITMQ_USER=username
RABBITMQ_PASS=password
RABBITMQ_HOST=rmq-host:port
RABBITMQ_QUEUE=auth_queue_name
RABBITMQ_PASSPHRASE=passphrase

# Grpc configuration
VISION_HOST=grpc-host
VISION_PORT=grpc-port

# SSL certificates paths
RABBITMQ_CERT_PATH=path (for example: ./cert/gateway_cert.pem)
RABBITMQ_KEY_PATH=path (for example: ./cert/gateway_key.pem)
RABBITMQ_CA_PATH=path (for example: ../certs/ca.pem)
```

- Create a `.env` file in the auth-svc directory and add the following environment variables:
```env
# RabbitMQ configuration variables
RABBITMQ_DEFAULT_USER=username
RABBITMQ_DEFAULT_PASS=password
RABBITMQ_USER=username
RABBITMQ_PASS=password
RABBITMQ_HOST=rmq-host:port
RABBITMQ_QUEUE=auth_queue_name
RABBITMQ_CERT_PATH=path (for example: ./cert/auth_cert.pem)
RABBITMQ_KEY_PATH=path (for example: ./cert/auth_key.pem)
RABBITMQ_PASSPHRASE=password
RABBITMQ_CA_PATH=path (for example: ./cert/ca.pem)

# PGSQL configuration variables
DB_HOST=db_host
DB_PORT=db_port
DB_USERNAME=db_username
DB_PASSWORD=db_password
DB_NAME=db_name

# JWT configuration variables
JWT_SECRET=jwt_secret
```

## Running
Run the following command in the root directory to start the RabbitMQ, PostgreSQL, api-gateway-svc, auth-svc and grpc-vision-svc containers:
```bash
docker compose up
```

## Usage

You can interact with the Intelligent Image Analyzer service by sending HTTP POST requests to the Gateway Service through the following routes:

### Authentication Endpoints
- **Sign Up**: Register a new user account.
  - **Endpoint**: `/auth/signup`
  - **Method**: POST
  - **Request Body**: `{ "firstname": "FirstName", "lastname": "LastName", "email": "email@gmail.com", "password": "StrongPassword123!" }`

- **Sign In**: Authenticate an existing user and receive JWT tokens.
  - **Endpoint**: `/auth/signin`
  - **Method**: POST
  - **Request Body**: `{ "email": "email@gmail.com", "password": "StrongPassword123!" }`

- **Refresh Token**: Refresh the JWT token.
  - **Endpoint**: `/auth/refresh`
  - **Method**: POST
  - **Request Body**: `{ "token": "currentJwtToken" }`

### Vision Endpoints
- **Process Single Image**: Upload and process a single image.
  - **Endpoint**: `/vision/process-image`
  - **Method**: POST
  - **Request Body**: `{ "image": "base64EncodedImage", "model": "BLIP" }`
  - **RPC Method**: `ProcessImage`

- **Process Multiple Images**: Upload and process multiple images.
  - **Endpoint**: `/vision/process-image`
  - **Method**: POST
  - **Request Body**: `{ "images": ["base64EncodedImage1", "base64EncodedImage2"], "model": "BLIP" }`
  - **RPC Method**: `ProcessImageBatch`

