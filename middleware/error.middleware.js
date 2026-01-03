// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  try {
    let error = { ...err };
    error.message = err.message;

    // Log for the developer
    console.error(err);

    // Prisma Unique Constraint Error (e.g., Email already exists)
    if (err.code === "P2002") {
      error.message = "The information provided is already in use.";
      error.statusCode = 409;
    }

    // JWT Expired Error
    if (err.name === "TokenExpiredError") {
      error.message = "Your session has expired. Please log in again.";
      error.statusCode = 401;
    }

    res
      .status(error.statusCode || 500)
      .json({ success: false, error: error.message || "Server Error" });
  } catch (error) {
    console.error(error);
  }
};

export default errorMiddleware;
