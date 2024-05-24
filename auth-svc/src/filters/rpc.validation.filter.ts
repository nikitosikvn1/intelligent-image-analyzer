import { Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

/**
 * Implements an exception filter catching `HttpException` and transforming it into `RpcException`.
 * This enables consistent error handling across HTTP and RPC communication in a NestJS microservices architecture,
 * ensuring exceptions during HTTP request processing are compatible with RPC-style error handling.
 *
 * @class RpcValidationFilter
 * @implements {ExceptionFilter}
 */
@Catch(HttpException)
export class RpcValidationFilter implements ExceptionFilter {
  /**
   * Transforms the caught `HttpException` into an `RpcException`. Automatically called by NestJS
   * when an `HttpException` is thrown, facilitating unified exception handling across different
   * communication styles.
   *
   * @param {HttpException} exception The caught HTTP exception instance.
   * @returns {RpcException} A new `RpcException` instance based on the original HTTP exception.
   */
  catch(exception: HttpException): RpcException {
    return new RpcException(exception.getResponse());
  }
}
