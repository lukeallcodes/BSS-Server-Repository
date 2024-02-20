import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface RequestWithUser extends Request {
    user?: string | JwtPayload;
}

// Middleware to validate JWT
const validateJWT = (req: RequestWithUser, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Assuming token is in the format 'Bearer [token]'

        jwt.verify(token, 'your-secret-key', (err, user) => {
            if (err) {
                return res.sendStatus(403); // Forbidden if token is invalid
            }

            req.user = user; // Add the user payload to the request object
            next(); // Proceed to the next middleware/route handler
        });
    } else {
        res.sendStatus(401); // Unauthorized if no token is present
    }
};

export default validateJWT;
