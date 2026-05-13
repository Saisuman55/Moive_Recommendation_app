class ApiResponse {
  constructor(statusCode, data, message = "Success", success = true) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = success;
  }
}

/**
 * Sends a standardized success response
 * @param {object} res - Express response object
 * @param {number} [statusCode=200] - HTTP status code
 * @param {object} [data={}] - Response data
 * @param {string} [message] - Response message (optional)
 */
export const sendSuccess = (res, statusCode = 200, data = {}, message) => {
  const response = {
    success: true,
    data,
    ...(message && { message }),
  };
  return res.status(statusCode).json(response);
};

/**
 * Sends a standardized error response
 * @param {object} res - Express response object
 * @param {number} [statusCode=400] - HTTP status code
 * @param {string} [message="An error occurred"] - Error message
 * @param {object} [errors={}] - Detailed errors object
 */
export const sendError = (res, statusCode = 400, message, errors = {}) => {
  const response = {
    success: false,
    error: message || "An error occurred",
    ...(Object.keys(errors).length > 0 && { errors }),
  };
  return res.status(statusCode).json(response);
};

export default ApiResponse;