
# HTTP NestJS Application for Boosta B2B
## Description

This repository holds all the logic for the onboarding services of all users.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Docker

```bash
# Spin up a database on the fly
$ make start-db

# Erase all data of the database and start all over again
# Be careful, this will also remove the dist folder
make refresh-db
```
