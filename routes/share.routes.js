import { Router } from "express";
import {
  confirmShareCredential,
  deleteSharePermission,
  patchCredentialFav,
  requestShareCredential,
} from "../controller/share.controller.js";

const shareRouter = Router();

shareRouter.post("/share-request", requestShareCredential);

shareRouter.post("/confirm-share", confirmShareCredential);

shareRouter.delete("/share/:credentialId/:targetUserId", deleteSharePermission);

shareRouter.patch("/:id/favorite", patchCredentialFav);

export default shareRouter;
