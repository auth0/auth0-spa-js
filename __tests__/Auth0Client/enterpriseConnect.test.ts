import { MessageChannel } from 'worker_threads';
import { Auth0Client } from '../../src/Auth0Client';
import { TEST_CLIENT_ID, TEST_DOMAIN } from '../constants';

jest.mock('es-cookie');
jest.mock('../../src/jwt');
jest.mock('../../src/worker/token.worker');

const mockWindow = <any>global;

describe('Auth0Client - enterpriseConnect init warnings', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockWindow.crypto = {
      subtle: { digest: () => 'foo' },
      getRandomValues: () => '123'
    };
    mockWindow.MessageChannel = MessageChannel;
    mockWindow.Worker = {};
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    warnSpy.mockRestore();
  });

  it('warns when offline_access is in scope', () => {
    new Auth0Client({
      domain: TEST_DOMAIN,
      clientId: TEST_CLIENT_ID,
      enterpriseConnect: true,
      authorizationParams: { scope: 'openid profile offline_access' }
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('offline_access')
    );
  });

  it('warns when a static organization is set', () => {
    new Auth0Client({
      domain: TEST_DOMAIN,
      clientId: TEST_CLIENT_ID,
      enterpriseConnect: true,
      authorizationParams: { organization: 'org_123' }
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('organization')
    );
  });

  it('does not warn when scope and organization are clean', () => {
    new Auth0Client({
      domain: TEST_DOMAIN,
      clientId: TEST_CLIENT_ID,
      enterpriseConnect: true,
      authorizationParams: { scope: 'openid profile email' }
    });

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does not warn when enterpriseConnect is not set', () => {
    new Auth0Client({
      domain: TEST_DOMAIN,
      clientId: TEST_CLIENT_ID,
      authorizationParams: { scope: 'openid profile offline_access', organization: 'org_123' }
    });

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
