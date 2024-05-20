import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userTypes";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("reqdata: ", req.body);
  // return res.json({})  ;
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    const error = createHttpError(400, "All fields are required!");
    return next(error);
  }
  try {
    const user = await userModel.findOne({ email });
    if (user) {
      const error = createHttpError(
        400,
        "User already exist with this email !"
      );
      return next(error);
    }
  } catch (err) {
    return next(createHttpError(500, "Error while getting user!"));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let newUser: User;

  try {
    newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
  } catch (err) {
    return next(createHttpError(500, "Error while creating user!"));
  }

  try {
    // Token generation
    const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
      expiresIn: "7d",
    });

    res.json({ access_token: token });
  } catch (err) {
    return next(createHttpError(500, "Error while signing the jwt token!"));
  }
};

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NjRiNTBmNmE2NDg4Nzk1YzE2YjIwNTAiLCJpYXQiOjE3MTYyMTE5NTgsImV4cCI6MTcxNjgxNjc1OH0.a8KJcDwispzQC5k8RNbGI-X3AoCsdofLyRh4SXPZ3wo
