import {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";

interface JwtPayload {
  id: number;
  role: string;
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader =
      req.headers.authorization;

    // No Authorization header
    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message:
          "Access token is required",
      });
    }

    // Extract token
    const token =
      authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        message:
          "Access token is required",
      });
    }

    // JWT secret
    const secret =
      process.env.JWT_SECRET;

    if (!secret) {
      console.error(
        "JWT_SECRET is not configured"
      );

      return res.status(500).json({
        message:
          "JWT secret is not configured",
      });
    }

    // Verify token
    const decoded =
      jwt.verify(
        token,
        secret
      ) as JwtPayload;

    // Validate required payload
    if (
      !decoded.id ||
      !decoded.role
    ) {
      return res.status(401).json({
        message:
          "Invalid token payload",
      });
    }

    // Attach authenticated user
    req.user = {
      id: decoded.id,
      role: decoded.role
        .trim()
        .toUpperCase(),
    };

    next();

  } catch (error) {

    console.error(
      "Authentication error:",
      error
    );

    return res.status(401).json({
      message:
        "Invalid or expired token",
    });
  }
};