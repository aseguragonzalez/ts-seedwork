FROM node:22-alpine

RUN apk add --no-cache git make

WORKDIR /workspace

COPY package*.json ./
# HUSKY=0 prevents husky from trying to install git hooks during image build
# (no .git present in build context)
RUN HUSKY=0 npm ci

COPY . .
