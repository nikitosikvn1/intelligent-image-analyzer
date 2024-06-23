import { IsNotEmpty, IsUUID } from "class-validator";
import { ValidationMessages } from "../../dto/messages/validation-messages";

/**
 * Data Transfer Object (DTO) used for verification key validation. This class validates the verification key 
 * against defined criteria to ensure data integrity and security before processing the verification operation.
 */
export class VerificationKeyDto {
  /**
   * The verification key used to validate a user account, ensuring it is a valid UUID.
   * 
   * @IsNotEmpty Ensures the key field is not empty, validating its presence.
   * @IsUUID Validates the key is a UUID to ensure it conforms to the expected format.
   */
  @IsNotEmpty()
  @IsUUID('4', { message: ValidationMessages.verifyKey.valid })
  key: string;
}