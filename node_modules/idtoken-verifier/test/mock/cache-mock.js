function CacheMock(options) {
  this.setAssertion = options.setAssertion || false;
  this.getResponse = options.getResponse || false;
}

CacheMock.prototype.get = function(key) {
  if (this.getResponse) {
    if (this.getResponse.hasOwnProperty(key)) {
      return this.getResponse[key];
    } else {
      throw new Error('Invalid get key ' + key);
    }
  }

  return null;
};

CacheMock.prototype.has = function(key) {
  if (this.getAssertion) {
    if (this.getAssertion.indexOf(key) === -1) {
      throw new Error('invalid has call ' + key);
    }
  }

  if (this.getResponse) {
    return this.getResponse.hasOwnProperty(key);
  }

  return false;
};

CacheMock.prototype.set = function(key, value) {
  if (this.setAssertion) {
    if (
      !this.setAssertion.hasOwnProperty(key) ||
      this.setAssertion[key].indexOf(value) === -1
    ) {
      throw new Error('invalid set call ' + key);
    }
  }
};

function validKey() {
  var pk = {
    modulus:
      'c333dc7a7b463661d2ecc75d4b96c60f34f5d77d2329de0dc6990a8ecd171760a978daf9c059ed60c4bd4174a9acc8b6c608bbf38124eb897fd399d8b008c328d3c459b8efd61f8daf634fc7f03621d097634aee47892b7d0df9e1f51eceee8fa9032a385f7a6704834e193c497564eabf78aa2b3fc097d9d6b240edce6ad6439c587b15d5243eed8888232372ac8d332f957a5088e4b8d64d5a112db78e0022acdcda84c4534624573367266c010246a6f7a000849de0cb98e727f29d02c512d20c2ab47e814409a3783a8df4567369416e04f8aaf0f2a1d7411e8d66e4e716ecd6bc2a007b9a2ee7cffa1fde83b6edaa51fd1de4c1de5faa2118c91ac5192f',
    exp: '010001'
  };

  var cache = new CacheMock({
    getResponse: {
      'https://wptest.auth0.com/QzE4N0ZBM0VDQzE2RUU0NzI1QzY1MzQ4QTk1MzAwMEI4RDgxNzE4Rg': pk
    }
  });

  return cache;
}

function invalidKey() {
  var pk = {
    modulus:
      'bc60a150631359935f46c5f177e06dcc2e110d838caad221587a25fa5bc0ed765a94cc40616753c0ababd1845e73ddde85af680845e6cbb39bd48d9d27c3909afd86e83988ee35242fd7cb53e8f392499c933488fe6007d91dbb679f873626f94a0b9d58183aac4731bd1e8b5abc79ecdeaf7e8ebcc304fdfc51e566968ae8d5c0fdd5855b87f735fb5f58b2fb06acbdd2c3b8be28cce8b31213aae797957e7f3e1b90d83e98fcf847e91498cfe5777fb1beda3bf41b7126f3b0e6aaad2cd9d18e20f3a2a46ff96ac1770e558fc3efae0d5fc2c71f5561e59aafaae2b1675cbccd43b842b07ad424fd69effed2a255a6f6f4e807dfc6b329e4eff8f24e0d6915',
    exp: '010001'
  };

  var cache = new CacheMock({
    getResponse: {
      'https://wptest.auth0.com/QzE4N0ZBM0VDQzE2RUU0NzI1QzY1MzQ4QTk1MzAwMEI4RDgxNzE4Rg': pk
    }
  });

  return cache;
}

export default {
  CacheMock: CacheMock,
  validKey: validKey,
  invalidKey: invalidKey
};
