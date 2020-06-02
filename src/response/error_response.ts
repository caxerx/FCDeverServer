import { BaseResponse } from "./base_response";

export class ErrorResponse<T> extends BaseResponse {
  message: T;

  constructor(message: T) {
    super(false);
    this.message = message;
  }
}
