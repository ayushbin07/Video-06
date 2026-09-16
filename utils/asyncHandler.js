// Wraps an asynchronous request handler so rejected promises reach Express error middleware.
const asyncHandler = (requestHandler) => {
  // Calls the wrapped handler and forwards any rejected promise to next().
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler;

/*
const asyncHandler = (fn) => async (req, res, next) => {
    try {
        
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}
*/
