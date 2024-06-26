import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';
import { ValidationMessages } from './messages/validation-messages';

/**
 * Data Transfer Object (DTO) used for verification data validation. This class validates the verification data 
 * against defined criteria to ensure data integrity and security before processing the verification operation.
 */
export class VerificationDataDto {
  /**
   * The verification key used to validate a user account, ensuring it is a valid UUID.
   * 
   * @IsNotEmpty() Ensures the key field is not empty, validating its presence.
   * @IsUUID Validates the key is a UUID to ensure it conforms to the expected format.
   */
  @IsNotEmpty()
  @IsUUID('4', { message: ValidationMessages.verifyKey.valid })
  key: string;

  /**
   * The email address of the user receiving the verification email, validated to confirm it is a well-formed email address.
   * 
   * @IsNotEmpty() Prevents empty values.
   * @IsEmail Validates the input is a well-formed email address.
   */
  @IsNotEmpty()
  @IsEmail({}, { message: ValidationMessages.email.valid })
  resiverEmail: string;
}
