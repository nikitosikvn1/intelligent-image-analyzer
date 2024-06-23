/**
 * A comprehensive collection of custom validation messages used across various DTOs for user authentication and registration.
 * These messages are designed to provide clear, actionable feedback to the end user when the data submitted does not meet
 * the expected validation criteria. Each key within this object corresponds to a specific field in the DTOs and contains
 * messages for different validation rules.
 * 
 * This structured approach not only enhances code maintainability by centralizing validation messages but also ensures consistency
 * in user feedback throughout the application's authentication process.
 */

export const ValidationMessages = {
  verifyKey: {
    valid: 'key must be a valid UUID',
  },
  firstName: {
    string: 'first name must be a string',
    alpha: 'first name must contain only latin letters',
  },
  lastName: {
    string: 'last name must be a string',
    alpha: 'last name must contain only latin letters',
  },
  email: {
    valid: 'email must be a valid email address',
  },
  password: {
    string: 'password must be a string',
    minLength: 'password must be at least 8 characters long',
    maxLength: 'password must be at most 128 characters long',
    strong: 'password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character',
    required: 'password is required',
  },
};
