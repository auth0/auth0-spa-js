# Contribution

Please read [Auth0's contribution guidelines](https://github.com/auth0/open-source-template/blob/master/GENERAL-CONTRIBUTING.md).

## Environment setup

- Make sure you have node and npm installed
- Run `npm install` to install dependencies
- Follow the local development steps below to get started

## Local development

- `npm install`: install dependencies
- `npm start`: starts development http server at [http://localhost:3000](http://localhost:3000) with live reload enabled
- `npm run test`: run unit tests
- `npm run test:watch`: run unit tests continuously
- `npm run test:integration`: run integration tests
- `npm run test:watch:integration`: run integration tests continuously
- `npm run build`: build distribution files
- `npm run test:es-check`: check if distribution files are compatible with browsers
- `npm run print-bundle-size`: print the final bundle size of distribution files

## Testing

### Adding tests

- Unit tests go inside [\_\_tests\_\_](https://github.com/auth0/auth0-spa-js/tree/master/__tests__)
- Integration tests go inside [cypress/integration](https://github.com/auth0/auth0-spa-js/tree/master/cypress/integration)

### Running tests

Run unit and integration tests before opening a PR:

```bash
npm run test
npm run test:integration
```

Also include any information about essential manual tests.
