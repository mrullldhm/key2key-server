import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.js";
// import db from "../database/db.js";

export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // jwt.sign(payload, secret, options);
    const token = jwt.sign({}, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    // const token = jwt.sign({ id: result.lastInsertRowid }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    console.log(username, email, password, hashedPassword);
    res.status(201).json({
      success: true,
      message: "User sign-up successfully",
      data: {
        token,
        // user: newUsers[0],
      },
    });
  } catch (err) {
    next(err);
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = false;

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const error = new Error("Unauthorized");
      error.statusCode = 401;
      throw error;
    }

    // jwt.sign(payload, secret, options);
    const token = jwt.sign({}, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    // const token = jwt.sign({ id: result.lastInsertRowid }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    console.log(email, password);
    res.status(201).json({
      success: true,
      message: "User sign-in successfully",
      data: {
        token,
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const signout = (_, res, next) => {
  try {
    // res.clearCookie("token");

    res.status(201).json({
      success: true,
      message: "User sign-out successfully",
    });
  } catch (err) {
    next(err);
  }
};
