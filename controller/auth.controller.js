import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.client.js";
import { generateKeys } from "../utils/crypto.util.js";

export const signup = async (req, res, next) => {
  try {
    // Data from request
    const { email, password } = req.body;

    // Check if a user already exist
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      const error = new Error("User already exist");
      error.statusCode = 409;
      throw error;
    }

    // Generate Key Assets
    const { vaultKeySalt, publicKey, privateKey } = await generateKeys(
      password
    );

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Submit to database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        vaultKeySalt,
        publicKey,
        privateKey: privateKey,
      },
    });

    // Create a token
    // jwt.sign(payload, secret, options);
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({
      success: true,
      message: "User sign-up successfully",
      data: {
        token,
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const signin = async (req, res, next) => {
  try {
    // Data from request
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // Verify password for authentication
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const error = new Error("Unauthorized");
      error.statusCode = 401;
      throw error;
    }

    // Create a token
    // jwt.sign(payload, secret, options);
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({
      success: true,
      message: "User sign-in successfully",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          vaultKeySalt: user.vaultKeySalt,
          publicKey: user.publicKey,
          privateKey: user.privateKey,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const signout = (_, res, next) => {
  try {
    res.clearCookie("token");

    res.status(200).json({
      success: true,
      message: "User sign-out successfully",
    });
  } catch (err) {
    next(err);
  }
};
