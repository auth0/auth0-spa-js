import createAuth0Client, { Auth0Client } from './index';

const wrapper = createAuth0Client as any;

wrapper.Auth0Client = Auth0Client;
wrapper.createAuth0Client = createAuth0Client;

export default wrapper;
