export function ConfigurationError(message) {
  this.name = 'ConfigurationError';
  this.message = message || '';
}
ConfigurationError.prototype = Error.prototype;

export function TokenValidationError(message) {
  this.name = 'TokenValidationError';
  this.message = message || '';
}
TokenValidationError.prototype = Error.prototype;
