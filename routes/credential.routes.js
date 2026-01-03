import { Router } from "express";
import {
  createCredential,
  deleteCredential,
  getCredential,
  updateCredential,
} from "../controller/credential.controller.js";

const credentialRouter = Router();

credentialRouter.get("/", getCredential);

credentialRouter.post("/", createCredential);

credentialRouter.put("/:id", updateCredential);

credentialRouter.delete("/:id", deleteCredential);

export default credentialRouter;
