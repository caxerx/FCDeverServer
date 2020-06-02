import { BaseResponse } from "./base_response";

export class SuccessResponse<T> extends BaseResponse {
  result: T;

  constructor(result: T) {
    super(true);
    this.result = result;
  }
}
