import { NextFunction, Request, Response } from "express";
import { body, ValidationChain, validationResult } from "express-validator";

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) {
        break;
      }
    }
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    return res.status(422).json({ errors: errors.array() });
  };
};

export const loginValidator = [
  body("email").trim().isEmail().withMessage("Email is required"),
  body("password")
    .trim()
    .isLength({ min: 6 })
    .withMessage("Password should contain at least 6 characters"),
];

export const signupValidator = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("password")
    .trim()
    .isLength({ min: 6 })
    .withMessage("Password should contain at least 6 characters"),
];

export const otpSendValidator = [
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("purpose")
    .isIn(["signup", "reset_password"])
    .withMessage("Valid purpose is required"),
];

export const otpVerifyValidator = [
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("otp").trim().notEmpty().withMessage("OTP is required"),
  body("purpose")
    .isIn(["signup", "reset_password"])
    .withMessage("Valid purpose is required"),
];

export const resetPasswordValidator = [
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("password")
    .trim()
    .isLength({ min: 6 })
    .withMessage("Password should contain at least 6 characters"),
];

export const chatCompletionValidator = [
  body().custom((value, { req }) => {
    const hasMessage =
      req.body.message &&
      typeof req.body.message === "string" &&
      req.body.message.trim() !== "";
    const hasFile = req.body.file && req.body.file.base64;
    if (!hasMessage && !hasFile) {
      throw new Error("Message or file is required");
    }
    return true;
  }),
];
