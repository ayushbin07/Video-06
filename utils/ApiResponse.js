// Builds a consistent response object with status, data, message, and success fields.
class ApiResponse {
  // Stores the response values and marks status codes below 400 as successful.
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
