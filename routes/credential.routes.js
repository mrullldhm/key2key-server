import { Router } from "express";
import {
  createCredential,
  deleteCredential,
  getAllCredential,
  getCredential,
  updateCredential,
} from "../controller/credential.controller.js";

const credentialRouter = Router();

credentialRouter.get("/:id", getCredential);

credentialRouter.get("/", getAllCredential);

credentialRouter.post("/", createCredential);

credentialRouter.put("/:id", updateCredential);

credentialRouter.delete("/:id", deleteCredential);

export default credentialRouter;
