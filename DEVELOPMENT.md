## Environment

- Node >= 12.x

## Building

The SDK uses [Rollup](https://rollupjs.org/guide/en/) to compile all JavaScript assets into a set of output modules to be consumed by other module builders such as [Webpack](https://webpack.js.org/) and Rollup, or directly into and HTML file via the CDN.

To perform a build, use the `build` script:

```
npm run build
```

### Bundle stats

Bundle size statistics can be generated when `WITH_STATS=true` is present in the environment. This outputs production bundle stats into the terminal when running `npm run build`, but also generates a visualization into the `bundle-stats` folder.

To build with stats then view the results, do:

```
WITH_STATS=true npm run build
npm run serve:stats
```

Then browse to http://localhost:5000 to view an HTML-based bundle size report.

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

Integration tests can be run through [Cypress](https://www.cypress.io/) to perform integration testing using the SDK and Auth0. You will need to supply the password for the user used in the integration tests using an environment variable.

To run these, use:

```
CYPRESS_INTEGRATION_PASSWORD=<password> npm run test:integration
```

To perform these tests interactively and watch the output, use:

```
CYPRESS_INTEGRATION_PASSWORD=<password> npm run test:watch:integration
```

### Test coverage

Coverage is automatically generated just by running `npm test`. To view the coverage output, use:

```
npm run serve:coverage
```

Then, browse to http://localhost:5000 to view an HTML-based coverage report.

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

You may specify a different port for the development server by specifying the `DEV_PORT` environment variable:

```
DEV_PORT=8080 npm start
```

The Playground may not cover all use cases. In this case, modify the [index.html file](https://github.com/auth0/auth0-spa-js/blob/master/static/index.html) to configure the SDK as desired to invoke different behaviors.
