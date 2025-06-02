export enum SuccessHttpStatusCode {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
}

export class StandardResponse {
  public statusCode: SuccessHttpStatusCode;
  public message: string;
  public data?: any;

  constructor(
    data?: any,
    message: string = "Request successful",
    statusCode: SuccessHttpStatusCode = SuccessHttpStatusCode.OK,
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}
