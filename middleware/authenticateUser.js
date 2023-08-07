import jwt from 'jsonwebtoken'

const JWT_SECRET=process.env.JWT_TOKEN;


const authenticateUser = (req, res, next) => {
  const authTokenHeader = req.headers.authorization;

  // Check if the Authorization header exists and starts with "Bearer "
  if (!authTokenHeader || !authTokenHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No authToken provided" });
  }

  // Extract the authToken from the header
  const authToken = authTokenHeader.substring(7); // Remove "Bearer " prefix

  try {
    // Verify the authToken and decode it to get the user data (e.g., user ID, email, etc.)
    const decodedToken = jwt.verify(authToken, JWT_SECRET);

    // Attach the decoded user data to the request object for future use in routes
    req.user = decodedToken;

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid authToken" });
  }
};

export default authenticateUser