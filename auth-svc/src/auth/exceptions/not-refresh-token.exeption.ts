import { JsonWebTokenError } from 'jsonwebtoken';

/**
 * Exception for signaling that a provided JWT, expected to be a refresh token, does not meet the criteria.
 * This class extends JsonWebTokenError, specifying an error specific to refresh token validation processes.
 *
 * @class NotRefreshTokenError
 * @extends JsonWebTokenError
 */
export class NotRefreshTokenError extends JsonWebTokenError {
  /**
   * Constructs a new `NotRefreshTokenError`.
   * This constructor initializes the base `JsonWebTokenError` with a custom message indicating the specific nature of the error.
   *
   * @constructor
   */
  constructor() {
    super('Provided token is not a refresh token');
    this.name = 'NotRefreshTokenError';
  }
}
