import { Router } from "express";
import {
  getVaultSalt,
  signin,
  signout,
  signup,
} from "../controller/auth.controller.js";

const authRouter = Router();

authRouter.post("/sign-up", signup);

authRouter.post("/sign-in", signin);

authRouter.post("/sign-out", signout);

authRouter.get("/salt/:email", getVaultSalt);

export default authRouter;
