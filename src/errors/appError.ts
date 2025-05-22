export enum HttpStatusCode {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403, // 🔥 Add this
  NOT_FOUND = 404,
  EXISTS = 409,
  INTERNAL_SERVER = 500,
}
class BaseError extends Error {
  public readonly name: string;
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;

  constructor(
    name: string,
    statusCode: HttpStatusCode,
    isOperational: boolean,
    description: string
  ) {
    super(description);
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this);
  }
}

export class RequiredParameterError extends BaseError {
  constructor(param: string) {
    super(
      `RequiredParameterError`,
      HttpStatusCode.BAD_REQUEST,
      true,
      `${param} cannot be empty, null or undefined.`
    );
  }
}

export class BadRequestError extends BaseError {
  constructor(param: string) {
    super(`BadRequestError`, HttpStatusCode.BAD_REQUEST, true, `${param}.`);
  }
}
export class NotfoundError extends BaseError {
  constructor(param: string) {
    super(
      `NotfoundError`,
      HttpStatusCode.NOT_FOUND,
      true,
      `Requested resource cannot be found`
    );
  }
}

export class UniqueConstraintError extends BaseError {
  constructor(param: string) {
    super(
      "UniqueConstraintError",
      HttpStatusCode.EXISTS,
      true,
      `${param} must be unique.`
    );
  }
}
export class UnauthorizedError extends BaseError {
  constructor(param: string) {
    super("UnauthorizedError", HttpStatusCode.UNAUTHORIZED, true, `${param}`);
  }
}

export class MessageBrokerError extends BaseError {
  constructor(param: string) {
    super(`MessageBrokerError`, HttpStatusCode.BAD_REQUEST, true, `${param}`);
  }
}

export class InvalidParameterError extends BaseError {
  constructor(param: string) {
    super(
      `InvalidParameterError`,
      HttpStatusCode.BAD_REQUEST,
      true,
      `${param}`
    );
  }
}

export class ForbiddenError extends BaseError {
  constructor(param: string) {
    super("ForbiddenError", HttpStatusCode.FORBIDDEN, true, `${param}`);
  }
}

export class InternalServerError extends BaseError {
  constructor(param: string) {
    super(
      "InternalServerError",
      HttpStatusCode.INTERNAL_SERVER,
      true,
      `${param}`
    );
  }
}
