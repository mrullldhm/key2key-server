import { Router } from "express";
import {
  createPassword,
  deletePassword,
  getPassword,
  updatePassword,
} from "../controller/password.controller.js";

const passwordRouter = Router();

passwordRouter.get("/", getPassword);

passwordRouter.post("/", createPassword);

passwordRouter.put("/:id", updatePassword);

passwordRouter.delete("/:id", deletePassword);

export default passwordRouter;
