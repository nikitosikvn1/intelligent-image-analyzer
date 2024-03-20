export const ValidationMessages = {
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
  },
};
