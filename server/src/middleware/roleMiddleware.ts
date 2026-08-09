import {
  Request,
  Response,
  NextFunction,
} from "express";

export const authorizeRoles =
  (...allowedRoles: string[]) => {
    return (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({
          message:
            "Authentication required",
        });
      }

      const userRole =
        String(user.role || "")
          .trim()
          .toUpperCase();

      const roles =
        allowedRoles.map((role) =>
          String(role)
            .trim()
            .toUpperCase()
        );

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          message:
            "You do not have permission to access this resource",
        });
      }

      next();
    };
  };