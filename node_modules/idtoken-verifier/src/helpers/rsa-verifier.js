/*
Based on the work of Tom Wu
http://www-cs-students.stanford.edu/~tjw/jsbn/
http://www-cs-students.stanford.edu/~tjw/jsbn/LICENSE
*/

import BigInteger from 'jsbn';
import SHA256 from 'crypto-js/sha256';

var DigestInfoHead = {
  sha1: '3021300906052b0e03021a05000414',
  sha224: '302d300d06096086480165030402040500041c',
  sha256: '3031300d060960864801650304020105000420',
  sha384: '3041300d060960864801650304020205000430',
  sha512: '3051300d060960864801650304020305000440',
  md2: '3020300c06082a864886f70d020205000410',
  md5: '3020300c06082a864886f70d020505000410',
  ripemd160: '3021300906052b2403020105000414'
};

var DigestAlgs = {
  sha256: SHA256
};

function RSAVerifier(modulus, exp) {
  this.n = null;
  this.e = 0;

  if (modulus != null && exp != null && modulus.length > 0 && exp.length > 0) {
    this.n = new BigInteger(modulus, 16);
    this.e = parseInt(exp, 16);
  } else {
    throw new Error('Invalid key data');
  }
}

function getAlgorithmFromDigest(hDigestInfo) {
  for (var algName in DigestInfoHead) {
    var head = DigestInfoHead[algName];
    var len = head.length;

    if (hDigestInfo.substring(0, len) === head) {
      return {
        alg: algName,
        hash: hDigestInfo.substring(len)
      };
    }
  }
  return [];
}

RSAVerifier.prototype.verify = function(msg, encsig) {
  encsig = encsig.replace(/[^0-9a-f]|[\s\n]]/gi, '');

  var sig = new BigInteger(encsig, 16);
  if (sig.bitLength() > this.n.bitLength()) {
    throw new Error('Signature does not match with the key modulus.');
  }

  var decryptedSig = sig.modPowInt(this.e, this.n);
  var digest = decryptedSig.toString(16).replace(/^1f+00/, '');

  var digestInfo = getAlgorithmFromDigest(digest);
  if (digestInfo.length === 0) {
    return false;
  }

  if (!DigestAlgs.hasOwnProperty(digestInfo.alg)) {
    throw new Error('Hashing algorithm is not supported.');
  }

  var msgHash = DigestAlgs[digestInfo.alg](msg).toString();
  return digestInfo.hash === msgHash;
};

export default RSAVerifier;
