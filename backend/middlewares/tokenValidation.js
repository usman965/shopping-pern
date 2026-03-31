import jwt from 'jsonwebtoken';
import 'dotenv/config';

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    // Extract token from "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) {
        return res.status(401).json({ message: 'Access denied. No token provided.' }); // No token
    }

    jwt.verify(token, process.env.CRYPTR_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token.' }); // Invalid token
        }
        req.user = user; // Attach the decoded user payload to the request object
        next(); // Proceed to the protected route handler
    });
}

export default authenticateToken;


