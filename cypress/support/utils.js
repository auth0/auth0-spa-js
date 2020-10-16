module.exports.shouldBeUndefined = e => expect(e).to.be.undefined;
module.exports.shouldNotBeUndefined = e => expect(e).to.not.be.undefined;
module.exports.shouldBe = (expected, actual) => expect(actual).to.eq(expected);

module.exports.shouldInclude = (expected, actual) =>
  expect(actual).to.include(actual);

module.exports.shouldNotBe = (expected, actual) =>
  expect(actual).to.not.eq(expected);

module.exports.whenReady = () =>
  cy.get('#loaded', { timeout: 10000 }).then(() => cy.window());
