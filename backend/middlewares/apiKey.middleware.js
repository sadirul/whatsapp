import User from '../models/User.js';

export const apiKeyMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ success: false, message: 'API key required' });
    }

    const user = await User.findOne({ where: { api_key: apiKey } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid API key' });
    }

    req.userId = user.id;
    req.userEmail = user.email;
    next();
  } catch (error) {
    console.error('API Key Middleware Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export default apiKeyMiddleware;
