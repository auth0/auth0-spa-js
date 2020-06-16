## Environment

- Node >= 10.x

## Building

The SDK uses [Rollup](https://rollupjs.org/guide/en/) to compile all JavaScript assets into a set of output modules to be consumed by other module builders such as [Webpack](https://webpack.js.org/) and Rollup, or directly into and HTML file via the CDN.

To perform a build, use the `build` script:

```
npm run build
```

## Running Tests

### Unit tests

Unit tests can be executed using [Jest](https://jestjs.io/) by issuing the following command:

```
npm test
```

To interactively perform tests using Jest's `watch` mode, use:

```
npm run test:watch
```

### Integration tests

Integration tests can be run through [Cypress](https://www.cypress.io/) to perform integration testing using the SDK and Auth0. To run these, use:

```
npm run test:integration
```

To perform these tests interactively and watch the output, use:

```
npm run test:watch:integration
```

## The SDK Playground

The SDK provides a simple [Vue JS](https://vuejs.org/) app to test out and experiment with features of the SDK. This Playground is also used by the integration tests to verify behaviors. If you make changes to the Playground that are to be commited, ensure that the integration tests pass.

To test the SDK manually and play around with the various options and features, you can use the Playground by cloning this repository and using:

```
# Install dependencies
npm i

# Run the playground app
npm start
```

This will open a web server on `http://localhost:3000` and display a simple web app that allows you to manually perform various features of the SDK. This is preconfigured with an Auth0 tenant and client ID but you may change this to your own for testing.

The Playground may not cover all use cases. In this case, modify the [index.html file](https://github.com/auth0/auth0-spa-js/blob/master/static/index.html) to configure the SDK as desired to invoke different behaviors.
