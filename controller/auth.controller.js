import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.client.js";
// import { generateKeys } from "../utils/crypto.util.js";

// export const signup = async (req, res, next) => {
//   try {
//     // Data from request
//     const { email, password } = req.body;

//     // Check if a user already exist
//     const existingUser = await prisma.user.findUnique({
//       where: {
//         email,
//       },
//     });

//     if (existingUser) {
//       const error = new Error("User already exist");
//       error.statusCode = 409;
//       throw error;
//     }

//     // Generate Key Assets
//     const { vaultKeySalt, publicKey, privateKey } = await generateKeys(
//       password
//     );

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Submit to database
//     const user = await prisma.user.create({
//       data: {
//         email,
//         password: hashedPassword,
//         vaultKeySalt,
//         publicKey,
//         privateKey: privateKey,
//       },
//     });

//     // Create a token
//     // jwt.sign(payload, secret, options);
//     const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
//       expiresIn: process.env.JWT_EXPIRES_IN,
//     });

//     res.status(201).json({
//       success: true,
//       message: "User sign-up successfully",
//       data: {
//         token,
//         user,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };

export const signup = async (req, res, next) => {
  try {
    const {
      email,
      password, // This is the HASH from the Angular frontend
      vaultKeySalt,
      publicKey,
      privateKey, // This is the ENCRYPTED private key from the frontend
    } = req.body;

    // 1. Standard check for existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const error = new Error("User already exists");
      error.statusCode = 409;
      throw error;
    }

    // 2. IMPORTANT: We hash the "Frontend Hash" one more time.
    // Why? If your DB leaks, the attacker gets a "Bcrypt of a Hash".
    // They STILL can't unlock the Vault because they don't have the original Client Hash.
    const salt = await bcrypt.genSalt(10);
    const serverSideHash = await bcrypt.hash(password, salt);

    // 3. Save everything to the database
    const user = await prisma.user.create({
      data: {
        email,
        password: serverSideHash,
        vaultKeySalt,
        publicKey,
        privateKey,
      },
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({
      success: true,
      message: "User signed up successfully",
      data: {
        token,
        user: { id: user.id, email: user.email },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body; // 'password' here is actually the HASH from Frontend

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      throw error;
    }

    // Verify the Client-Side Hash against the DB
    // Since the frontend sends the same hash every time,
    // bcrypt.compare will work perfectly.
    const isHashValid = await bcrypt.compare(password, user.password);

    if (!isHashValid) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          publicKey: user.publicKey,
        },
        privateKey: user.privateKey,
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

export const getVaultSalt = async (req, res, next) => {
  try {
    const { email } = req.params;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { vaultKeySalt: true }, // ONLY return the salt
    });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      vaultKeySalt: user.vaultKeySalt,
    });
  } catch (err) {
    next(err);
  }
};
