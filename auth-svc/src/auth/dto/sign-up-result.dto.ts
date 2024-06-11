import { IsString } from "class-validator";

/**
 * Data Transfer Object (DTO) representing the outcome of a user registration operation.
 * This class encapsulates the result status and any message(s) related to the registration process,
 * accommodating both single and multiple feedback messages.
 */
export class SignUpResultDto {
  /**
   * The status of the sign-up process, typically reflecting success or failure.
   * 
   * @IsString Ensures the status is expressed as a string, facilitating straightforward interpretation of the result.
   */
  @IsString()
  status: string;

  /**
   * Additional information or feedback about the sign-up process. This can be a single message
   * or a collection of messages providing detailed feedback or instructions.
   * 
   * The absence of the @IsString decorator on this property allows flexibility in the type of message(s) returned,
   * supporting both singular and plural forms of feedback without explicit validation.
   */
  message: string | Array<string>;
}
