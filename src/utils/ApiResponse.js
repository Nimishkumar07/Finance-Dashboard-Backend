/**
 * Standardized API response wrapper.
 * Every response from this API follows the same shape.
 */
class ApiResponse {
  constructor(statusCode, message, data = null) {
    this.success = statusCode < 400;
    this.message = message;
    if (data !== null) this.data = data;
  }

  static success(res, message, data = null, statusCode = 200) {
    return res.status(statusCode).json(new ApiResponse(statusCode, message, data));
  }

  static created(res, message, data = null) {
    return res.status(201).json(new ApiResponse(201, message, data));
  }

  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Paginated response with metadata
   */
  static paginated(res, message, { docs, total, page, limit }) {
    return res.status(200).json({
      success: true,
      message,
      data: docs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  }
}

module.exports = ApiResponse;
