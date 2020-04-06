import createAuth0Client, { Auth0Client } from './index';

export default Object.assign(createAuth0Client, {
  Auth0Client,
  createAuth0Client
});
