import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { COOKIE_NAME } from "./constants.js";

export const createToken = (id: string, email: string, expiresIn: string) => {
  const payload = { id, email };
  const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: expiresIn as any,
  });
  return token;
};

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.signedCookies[`${COOKIE_NAME}`];
  if (!token || token.trim() === "") {
    return res.status(401).json({ message: "Token Not Received" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET as string,
    (err: any, success: any) => {
      if (err) {
        return res.status(401).json({ message: "Token Expired or Invalid" });
      }
      res.locals.jwtData = success;
      return next();
    }
  );
};
