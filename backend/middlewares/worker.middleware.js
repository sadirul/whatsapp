export const workerMiddleware = (req, res, next) => {
  const secret = req.headers['x-worker-secret'];
  if (!secret || secret !== process.env.WORKER_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};

export default workerMiddleware;
