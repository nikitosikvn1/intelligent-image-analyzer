import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { JwtDto, SignInDto, SignUpDto } from '../dto';
import { ValidationMessages } from '../dto/messages/validation-messages';

describe('ValidationPipe', () => {
  const validationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: errors => new BadRequestException(errors),
  });

  // Define a generic function with a type parameter T
  const performValidation = async <T>(inputDto: T, metatype: new () => T, errorProperty: string, errorMessage: string) => {
    try {
      // Pass the generic type T to the transform method
      await validationPipe.transform(inputDto, { type: 'body', metatype: metatype });
      fail('Validation should fail but did not');
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      const responseMessage = e.getResponse().message;
      expect(responseMessage).toBeDefined();
      const propertyError = responseMessage.find(m => m.property === errorProperty);
      expect(propertyError).toBeDefined();
      expect(propertyError.constraints[Object.keys(propertyError.constraints)[0]]).toEqual(errorMessage);
    }
  };

  describe('SignUpDto', () => {
    it('should pass validation for valid input', async () => {
      // Given
      const inputDto: SignUpDto = {
        firstname: 'John',
        lastname: 'Kowalski',
        email: 'example@gmail.com',
        password: 'StrongPassword123!',
      };

      // When
      const result = await validationPipe.transform(inputDto, { type: 'body', metatype: SignUpDto });

      // Then
      expect(result).toEqual(inputDto);
    });

    it('should throw an error for invalid firstname', async () => {
      // Given
      const inputDto: SignUpDto = {
        firstname: 'John123', // Invalid as per assumed IsAlpha validation rule
        lastname: 'Kowalski',
        email: 'example@gmail.com',
        password: 'StrongPassword123!',
      };

      // Then
      await performValidation(inputDto, SignUpDto, 'firstname', ValidationMessages.firstName.alpha);
    });

    it('should throw an error for invalid lastname', async () => {
      // Given
      const inputDto: SignUpDto = {
        firstname: 'John',
        lastname: 'Kowalski123', // Invalid as per assumed IsAlpha validation rule
        email: 'example@gmail.com',
        password: 'StrongPassword123!',
      };

      // Then
      await performValidation(inputDto, SignUpDto, 'lastname', ValidationMessages.lastName.alpha);
    });

    it('should throw an error for invalid email', async () => {
      // Given
      const inputDto: SignUpDto = {
        firstname: 'John',
        lastname: 'Kowalski',
        email: 'examplegmail.com', // Invalid as per assumed IsEmail validation rule
        password: 'StrongPassword123!',
      };

      // Then
      await performValidation(inputDto, SignUpDto, 'email', ValidationMessages.email.valid);
    });

    it('should throw an error for invalid password', async () => {
      // Given
      const inputDto: SignUpDto = {
        firstname: 'John',
        lastname: 'Kowalski',
        email: 'examplegmail.com',
        password: 'invalid_passowerd', // Invalid as per assumed IsStrongPassword validation rule
      };

      // Then
      await performValidation(inputDto, SignUpDto, 'password', ValidationMessages.password.strong);
    });
  });

  describe('SignInDto', () => {
    it('should pass validation for valid input', async () => {
      // Given
      const inputDto: SignInDto = {
        email: 'example@gmail.com',
        password: 'StrongPassword123!',
      };

      // When
      const result = await validationPipe.transform(inputDto, { type: 'body', metatype: SignInDto });

      // Then
      expect(result).toEqual(inputDto);
    });

    it('should throw an error for invalid email', async () => {
      // Given
      const inputDto: SignInDto = {
        email: 'examplegmail.com', // Invalid as per assumed IsEmail validation rule
        password: 'StrongPassword123!',
      };

      // Then
      await performValidation(inputDto, SignInDto, 'email', ValidationMessages.email.valid);
    });

    it('should throw an error for invalid password', async () => {
      // Given
      const inputDto: SignInDto = {
        email: 'example@gmail.com',
        password: '', // Invalid as per assumed IsNotEmpty validation rule
      };

      // Then
      await performValidation(inputDto, SignInDto, 'password', ValidationMessages.password.required);
    });
  });

  describe('JwtDto', () => {
    it('should pass validation for a valid JWT token', async () => {
      // Given
      const inputDto: JwtDto = {
        token: 'valid.token.jwt',
      };

      // When
      const result = await validationPipe.transform(inputDto, { type: 'body', metatype: JwtDto });

      // Then
      expect(result).toEqual(inputDto);
    });

    it('should throw an error for an empty JWT token', async () => {
      // Given
      const inputDto: JwtDto = {
        token: '', // Invalid as per assumed IsNotEmpty validation rule
      };

      // Then
      await expect(validationPipe.transform(inputDto, { type: 'body', metatype: JwtDto }))
        .rejects
        .toThrow(BadRequestException);
    });
  });
});
