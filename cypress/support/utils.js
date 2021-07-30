module.exports.shouldBeUndefined = e => expect(e).to.be.undefined;
module.exports.shouldNotBeUndefined = e => expect(e).to.not.be.undefined;
module.exports.shouldBe = (expected, actual) => expect(actual).to.eq(expected);

module.exports.shouldInclude = (expected, actual) =>
  expect(actual).to.include(actual);

module.exports.shouldNotBe = (expected, actual) =>
  expect(actual).to.not.eq(expected);

module.exports.whenReady = () =>
  cy.get('#loaded', { timeout: 10000 }).then(() => cy.window());

module.exports.configureTenant = () => {
  //cy.get('#domain').clear().type('http://localhost:3000');
  //cy.get('#client_id').clear().type('testing');
  // cy.toggleSwitch('use-form-data');
  //cy.setSwitch('form-data', true);
  //cy.get('#save-config').click();
};

/**
 * Returns true if a is within b +- tolerance
 * @param {*} a The value to check
 * @param {*} b The value to compare against
 * @param {*} tolerance The tolerance value
 */
module.exports.tolerance = (a, b, tolerance) => {
  if (a >= b - tolerance && a <= b + tolerance) {
    return true;
  }
};
