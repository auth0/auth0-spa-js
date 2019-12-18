import expect from 'expect.js';
import nodeFetch from 'node-fetch';

import CacheMock from './mock/cache-mock';
import helpers from './helper/token-validation';
import sinon from 'sinon';

import * as error from '../src/helpers/error';
import IdTokenVerifier from '../src/index';

describe('jwt-verification', function() {
  describe('verify', () => {
    describe('with a configuration error', () => {
      it('should fail if the leeway is too big', done => {
        helpers.assertValidatorInitalizationError(
          {
            leeway: 301
          },
          'The leeway should be positive and lower than five minutes.',
          done
        );
      });

      it('should fail if the leeway is negative', done => {
        helpers.assertValidatorInitalizationError(
          {
            leeway: -1
          },
          'The leeway should be positive and lower than five minutes.',
          done
        );
      });

      it('should fail if the algorithm is not supported', done => {
        helpers.assertValidatorInitalizationError(
          {
            expectedAlg: 'HS256'
          },
          'Algorithm HS256 is not supported. (Expected algs: [RS256])',
          done
        );
      });
      it('should fail if the token is not valid', done => {
        helpers.assertTokenValidationError(
          {},
          null,
          'Cannot decode a malformed JWT',
          'asjkdhfgakdsjhf',
          done
        );
      });
    });
    it('should validate the supported algorithm before calling `getRsaVerifier`', done => {
      const spy = sinon.spy(IdTokenVerifier.prototype, 'getRsaVerifier');
      helpers.assertTokenValidationError(
        {
          issuer: 'https://wptest.auth0.com/',
          audience: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt'
        },
        'asfd',
        'Algorithm HS256 is not supported. (Expected algs: [RS256])',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA',
        done
      );
      expect(spy.callCount).to.be(0);
      IdTokenVerifier.prototype.getRsaVerifier.restore();
    });
    describe('with a valid configuration', () => {
      afterEach(() => {
        expect(IdTokenVerifier.prototype.getRsaVerifier.callCount).to.be(1);
        IdTokenVerifier.prototype.getRsaVerifier.restore();
      });
      it('should fail when `getRsaVerifier` fails', done => {
        const error = { error: 'fail' };
        sinon.stub(IdTokenVerifier.prototype, 'getRsaVerifier', (_, __, cb) =>
          cb(error)
        );
        var idv = new IdTokenVerifier();
        idv.verify(
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA',
          'test_nonce',
          err => {
            expect(err).to.be.eql(error);
            done();
          }
        );
      });
      it('should fail when `rsaVerifier.verify` returns false', function(done) {
        sinon.stub(IdTokenVerifier.prototype, 'getRsaVerifier', (_, __, cb) =>
          cb(null, {
            verify: () => {
              return false;
            }
          })
        );
        helpers.assertTokenValidationError(
          {
            issuer: 'https://wptest.auth0.com/',
            audience: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt'
          },
          'asfd',
          'Invalid signature.',
          null,
          done
        );
      });
      describe('when `rsaVerifier.verify` returns true', () => {
        beforeEach(() => {
          sinon.stub(IdTokenVerifier.prototype, 'getRsaVerifier', (_, __, cb) =>
            cb(null, {
              verify: () => {
                return true;
              }
            })
          );
        });
        it('validates issuer', done => {
          helpers.assertTokenValidationError(
            {},
            'asfd',
            'Issuer https://wptest.auth0.com/ is not valid.',
            null,
            done
          );
        });
        it('validates audience', done => {
          helpers.assertTokenValidationError(
            {
              issuer: 'https://wptest.auth0.com/'
            },
            'asfd',
            'Audience gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt is not valid.',
            null,
            done
          );
        });
        it('should validate nonce', done => {
          helpers.assertTokenValidationError(
            {
              issuer: 'https://wptest.auth0.com/',
              audience: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt'
            },
            'invalid',
            'Nonce does not match.',
            null,
            done
          );
        });
        it('should validate the nbf claim', done => {
          helpers.assertTokenValidationError(
            {
              issuer: 'https://wptest.auth0.com/',
              audience: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt'
            },
            'asfd',
            'The token is not valid until later in the future. Please check your computed clock.',
            'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJub25jZSI6ImFzZmQiLCJpYXQiOjE0OTczNjQyNzMsIm5iZiI6NDY1MzEyNDI3MywiZXhwIjo3ODA4ODg0MjczfQ.IWU4y_Q2jHOmOR50Kk64oYIa1scvRMxzOE7sly_R953eypSoHB1OEWROsG4-qsTStfaJ7c6LbxeCbzpiFMAXDr594vDXny2lb8W_mF8OoTBPxMMlSBisy60hcH_GJL864SNiijr4SEuPL5sAUAI4PL77FrMpVODZ_To9GwixkZ8ajN7E7CYwlK6xkUuq5PQOknNjc1KBFh5bwIuA5gRSi0ggp74pi3bR9MRGLxMvZx_7kxa6G2IeTcXYjBlDS8BnKpoW0d6vOK804DWA8OIYTTY8570FaOwxusxEK-D8LolA8v7JfYY2AvWkjXwxN9rtGlMjZrXiUMAk67eW8abGWw',
            done
          );
        });
        it('should validate the token expiration', done => {
          helpers.assertTokenValidationError(
            {
              issuer: 'https://wptest.auth0.com/',
              audience: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt'
            },
            'asfd',
            'Expired token.',
            null,
            done
          );
        });
        it('should fail with missing claims', done => {
          helpers.assertTokenValidationError(
            {
              issuer: 'https://wptest.auth0.com/',
              audience: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt'
            },
            'asfd',
            'Issuer undefined is not valid.',
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA',
            done
          );
        });
      });
    });
    describe('without stubing `getRsaVerifier`', () => {
      beforeEach(() => {
        global.fetch = nodeFetch;
      });
      afterEach(() => {
        global.fetch = undefined;
      });
      it('should fail with corrupt token', done => {
        helpers.assertTokenValidationError(
          {
            issuer: 'https://wptest.auth0.com/',
            audience: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt'
          },
          'asfd',
          'Invalid signature.',
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjk0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA',
          done
        );
      });
      it('should fetch the public key and verify the token ', done => {
        helpers.assertTokenValid(
          {
            issuer: 'https://wptest.auth0.com/',
            audience: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt',
            __disableExpirationCheck: true
          },
          'asfd',
          done
        );
      });
      it('should use cached key and verify the token ', done => {
        helpers.assertTokenValid(
          {
            issuer: 'https://wptest.auth0.com/',
            audience: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt',
            __disableExpirationCheck: true,
            jwksCache: CacheMock.validKey()
          },
          'asfd',
          done
        );
      });
    });
  });

  describe('getRsaVerifier', function() {
    it('should pass options.jwksURI through ', function(done) {
      var mockJwks = {
        getJWKS: function(options) {
          expect(options.jwksURI).to.be('https://example.com/');
          done();
        }
      };
      var revert = IdTokenVerifier.__set__({ jwks: mockJwks });

      var verifier = new IdTokenVerifier({ jwksURI: 'https://example.com/' });
      verifier.getRsaVerifier('iss', 'kid');
      revert();
    });
    it('should call callback once with error when an error is returned from jwks.getJWKS', function() {
      var mockJwks = {
        getJWKS: function() {}
      };
      var err = 'error';
      sinon.stub(mockJwks, 'getJWKS', function(obj, cb) {
        cb(err);
      });

      var revert = IdTokenVerifier.__set__({ jwks: mockJwks });

      var callback = sinon.spy();

      var verifier = new IdTokenVerifier({ jwksCache: CacheMock.validKey() });
      verifier.getRsaVerifier('iss', 'kid', callback);

      try {
        sinon.assert.calledOnce(callback);
        expect(callback.calledWith(err)).to.be.ok();
      } finally {
        revert();
      }
    });
  });

  describe('decode', () => {
    it('should decode the token', function() {
      var id_token =
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9.eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0.PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA';
      var verifier = new IdTokenVerifier();
      var result = verifier.decode(id_token);

      expect(result).to.eql({
        header: {
          typ: 'JWT',
          alg: 'RS256',
          kid: 'QzE4N0ZBM0VDQzE2RUU0NzI1QzY1MzQ4QTk1MzAwMEI4RDgxNzE4Rg'
        },
        payload: {
          iss: 'https://wptest.auth0.com/',
          sub: 'auth0|55d48c57d5b0ad0223c408d7',
          aud: 'gYSNlU4YC4V1YPdqq8zPQcup6rJw1Mbt',
          exp: 1482969031,
          iat: 1482933031,
          nonce: 'asfd'
        },
        encoded: {
          header:
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlF6RTROMFpCTTBWRFF6RTJSVVUwTnpJMVF6WTFNelE0UVRrMU16QXdNRUk0UkRneE56RTRSZyJ9',
          payload:
            'eyJpc3MiOiJodHRwczovL3dwdGVzdC5hdXRoMC5jb20vIiwic3ViIjoiYXV0aDB8NTVkNDhjNTdkNWIwYWQwMjIzYzQwOGQ3IiwiYXVkIjoiZ1lTTmxVNFlDNFYxWVBkcXE4elBRY3VwNnJKdzFNYnQiLCJleHAiOjE0ODI5NjkwMzEsImlhdCI6MTQ4MjkzMzAzMSwibm9uY2UiOiJhc2ZkIn0',
          signature:
            'PPoh-pITcZ8qbF5l5rMZwXiwk5efbESuqZ0IfMUcamB6jdgLwTxq-HpOT_x5q6-sO1PBHchpSo1WHeDYMlRrOFd9bh741sUuBuXdPQZ3Zb0i2sNOAC2RFB1E11mZn7uNvVPGdPTg-Y5xppz30GSXoOJLbeBszfrVDCmPhpHKGGMPL1N6HV-3EEF77L34YNAi2JQ-b70nFK_dnYmmv0cYTGUxtGTHkl64UEDLi3u7bV-kbGky3iOOCzXKzDDY6BBKpCRTc2KlbrkO2A2PuDn27WVv1QCNEFHvJN7HxiDDzXOsaUmjrQ3sfrHhzD7S9BcCRkekRfD9g95SKD5J0Fj8NA'
        }
      });
    });

    it('should return an error when trying to decode (not verify) a malformed token', function() {
      var id_token = 'this.is.not.a.jwt';
      var verifier = new IdTokenVerifier();
      var result = verifier.decode(id_token);
      expect(result).to.be.an(error.TokenValidationError);
      expect(result.message).to.eql('Cannot decode a malformed JWT');
    });

    it('should return an error when trying to decode (not verify) a token with invalid JSON contents', function() {
      var id_token = 'invalid.json.here';
      var verifier = new IdTokenVerifier();
      var result = verifier.decode(id_token);
      expect(result).to.be.an(error.TokenValidationError);
      expect(result.message).to.eql(
        'Token header or payload is not valid JSON'
      );
    });
  });

  describe('verifyExpAndIat', () => {
    it('disables validation when __disableExpirationCheck is set', () => {
      const itv = new IdTokenVerifier({ __disableExpirationCheck: true });
      const result = itv.verifyExpAndIat();
      expect(result).to.be(null);
    });
    it('validates exp', () => {
      //2016-12-28
      const exp = '148296903';
      const err = new IdTokenVerifier().verifyExpAndIat(exp);
      expect(err.message).to.eql('Expired token.');
      expect(err).to.be.a(error.TokenValidationError);
    });
    it('validates iat', () => {
      //2439-12-07
      const exp = '1482969031';
      const iat = '14829690311';
      const err = new IdTokenVerifier().verifyExpAndIat(exp, iat);
      expect(err.message).to.eql(
        'The token was issued in the future. Please check your computed clock.'
      );
      expect(err).to.be.a(error.TokenValidationError);
    });
    it('returns null if valid', () => {
      //2439-12-07
      const exp = '1482969031';
      //1974-09-13
      const iat = '148296903';
      const result = new IdTokenVerifier().verifyExpAndIat(exp, iat);
      expect(result).to.be(null);
    });
  });
});
describe('access_token validation', function() {
  describe('With empty access_tokens', function() {
    [null, undefined, ''].forEach(function(at) {
      it('should throw when access_token is `' + at + '`', function(done) {
        var access_token = at;
        var alg = 'RS256';
        var at_hash = 'at_hash';

        var itv = new IdTokenVerifier();
        itv.validateAccessToken(access_token, alg, at_hash, function(err) {
          expect(err.name).to.be('TokenValidationError');
          expect(err.message).to.be('Invalid access_token');
          done();
        });
      });
    });
  });
  it('should throw an error with HS256 id_token', function(done) {
    var access_token = 'YTvJYcYrrZYHUXLZK5leLnfmD5ZIA_EA';
    var alg = 'HS256';
    var at_hash = 'at_hash';

    var itv = new IdTokenVerifier();
    itv.validateAccessToken(access_token, alg, at_hash, function(err) {
      expect(err.name).to.be('TokenValidationError');
      expect(err.message).to.be(
        'Algorithm HS256 is not supported. (Expected alg: RS256)'
      );
      done();
    });
  });
  it('should throw an error when access_token is invalid', function(done) {
    var access_token = 'not an access token';
    var alg = 'RS256';
    var at_hash = 'cdukoaUswM9bo_yzrgVcrw';

    var itv = new IdTokenVerifier();
    itv.validateAccessToken(access_token, alg, at_hash, function(err) {
      expect(err.name).to.be('TokenValidationError');
      expect(err.message).to.be('Invalid access_token');
      done();
    });
  });
  it('should validate access_token with RS256 id_token', function(done) {
    var access_token = 'YTvJYcYrrZYHUXLZK5leLnfmD5ZIA_EA';
    var alg = 'RS256';
    var at_hash = 'cdukoaUswM9bo_yzrgVcrw';

    var itv = new IdTokenVerifier();
    itv.validateAccessToken(access_token, alg, at_hash, function(err) {
      expect(err).to.be(null);
      done();
    });
  });
});
