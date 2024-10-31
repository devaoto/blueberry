export default class RequestError extends Error {
  statusCode: number;

  constructor(message = "Request Error", statusCode = 400) {
    super(message);
    this.name = "RequestError";
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, RequestError.prototype);
  }
}
