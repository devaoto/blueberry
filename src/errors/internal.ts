export default class InternalServerError extends Error {
  statusCode: number;

  constructor(message = "Internal Server Error", statusCode = 500) {
    super(message);
    this.name = "InternalServerError";
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
