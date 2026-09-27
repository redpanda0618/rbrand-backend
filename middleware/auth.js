const jwt = require('jsonwebtoken');

// Reads the "Authorization: Bearer <token>" header, verifies it,
// and attaches the decoded payload to req.user. Rejects if missing/invalid.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Login required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired session, please log in again' });
  }
}

// Same as above, but also requires the token to belong to an admin account.
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.type !== 'admin') {
      return res.status(403).json({ error: 'Admin access only' });
    }
    next();
  });
}

module.exports = { requireAuth, requireAdmin };
