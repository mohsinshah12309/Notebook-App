const jwt = require('jsonwebtoken');
const JWT_SECRET = 'Mohsinisagood$boy';
const fetchUser = async (req, res, next) => {
  const token = req.header('auth-token');
  console.log('Received token:', token); // Add this
  
  if (!token) {
    return res.status(401).json({ error: "Please authenticate" });
  }

  try {
    const data = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', data); // Add this
    req.user = { id: data.userId };
    next();
  } catch (error) {
    console.error("Token error:", error.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};
module.exports = fetchUser;