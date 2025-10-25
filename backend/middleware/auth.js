const jwt = require('jsonwebtoken');
const { findUserByAddress } = require('../database/connection');

// Middleware to authenticate JWT tokens
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findUserByAddress(decoded.address);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    req.user = user;
    req.address = decoded.address;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to verify wallet signature
const verifyWalletSignature = async (req, res, next) => {
  const { address, signature, message } = req.body;
  
  if (!address || !signature || !message) {
    return res.status(400).json({ error: 'Address, signature, and message required' });
  }

  try {
    // TODO: Implement actual signature verification with ethers.js
    // const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    // const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();
    
    // For now, assume valid (implement proper verification in production)
    const isValid = true;
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    req.verifiedAddress = address.toLowerCase();
    next();
  } catch (error) {
    console.error('Signature verification error:', error);
    return res.status(500).json({ error: 'Signature verification failed' });
  }
};

// Rate limiting middleware
const rateLimitMap = new Map();

const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(clientId)) {
      rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const clientData = rateLimitMap.get(clientId);
    
    if (now > clientData.resetTime) {
      // Reset the window
      rateLimitMap.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
    }
    
    clientData.count++;
    next();
  };
};

// Validate user class middleware
const validateUserClass = (allowedClasses) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedClasses.includes(req.user.user_class)) {
      return res.status(403).json({ 
        error: 'Insufficient user class',
        required: allowedClasses,
        current: req.user.user_class
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  verifyWalletSignature,
  rateLimit,
  validateUserClass
};