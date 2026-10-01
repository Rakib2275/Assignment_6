import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import type { Role } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";

export interface RequestUser {
  email: string;
  name: string;
  userId: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}


// auth(Role.ADMIN, Role.CUSTOMER)
// auth() => all authenticated users
export const auth = (...requiredRoles: Role[]) => {
  return catchAsync(
    async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {

      // ==============================
      // Get Access Token
      // ==============================

      const token = req.cookies.accessToken
        ? req.cookies.accessToken
        : req.headers.authorization?.startsWith("Bearer ")
          ? req.headers.authorization.split(" ")[1]
          : req.headers.authorization;

      // ==============================
      // Token Missing
      // ==============================

      if (!token) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message:
            "You are not logged in. Please log in first.",
          errors: [
            {
              field: "authorization",
              message:
                "Access token is required.",
            },
          ],
        });
      }

      // ==============================
      // Verify Token
      // ==============================

      const verifiedToken = jwtUtils.verifyToken(
        token,
        config.jwt_access_secret
      );

      if (!verifiedToken.success) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message:
            "Invalid or expired access token.",
          errors: [
            {
              field: "token",
              message: verifiedToken.error,
            },
          ],
        });
      }

      // ==============================
      // Get User Information
      // ==============================

      const {
        email,
        name,
        userId,
        role,
      } = verifiedToken.data as JwtPayload;

      if (!email || !name || !userId || !role) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message:
            "Invalid authentication token.",
          errors: [
            {
              field: "token",
              message:
                "Required user information is missing from token.",
            },
          ],
        });
      }

      // ==============================
      // Role Authorization
      // ==============================

      if (
        requiredRoles.length > 0 &&
        !requiredRoles.includes(role as Role)
      ) {
        return res.status(403).json({
          success: false,
          statusCode: 403,
          message:
            "Forbidden. You don't have permission to access this resource.",
          errors: [
            {
              field: "role",
              message: `Required role: ${requiredRoles.join(
                ", "
              )}.`,
            },
          ],
        });
      }

      // ==============================
      // Check User from Database
      // ==============================

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
          email,
          name,
          role,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          statusCode: 401,
          message:
            "User not found. Please log in again.",
          errors: [
            {
              field: "user",
              message:
                "Authenticated user does not exist.",
            },
          ],
        });
      }

      // ==============================
      // Blocked User
      // ==============================

      if (user.status === "BLOCKED") {
        return res.status(403).json({
          success: false,
          statusCode: 403,
          message:
            "Your account has been blocked. Please contact support.",
          errors: [
            {
              field: "account",
              message:
                "Your account is currently blocked.",
            },
          ],
        });
      }

      // ==============================
      // Attach User to Request
      // ==============================

      req.user = {
        email: user.email,
        name: user.name,
        userId: user.id,
        role: user.role,
      };

      next();
    }
  );
};

