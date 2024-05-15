import { JsonWebTokenError } from 'jsonwebtoken';

/**
 * Exception for identifying when a provided JWT is mistakenly used as an access token.
 * Extends JsonWebTokenError, providing a specific message to clarify the nature of the error.
 *
 * @class NotAccessTokenError
 * @extends JsonWebTokenError
 */
export class NotAccessTokenError extends JsonWebTokenError {
  /**
   * Constructs a new `NotAccessTokenError`.
   * This constructor initializes the base `JsonWebTokenError` with a custom message indicating the specific nature of the error.
   *
   * @constructor
   */
  constructor() {
    super('Provided token is not an access token');
    this.name = 'NotAccessTokenError';
  }
}
