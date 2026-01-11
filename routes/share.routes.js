import { Router } from "express";
import {
  confirmShareCredential,
  deleteSharePermission,
  getCredentialAccessList,
  patchCredentialFav,
  requestShareCredential,
} from "../controller/share.controller.js";

const shareRouter = Router();

shareRouter.get("/:id/access-list", getCredentialAccessList);

shareRouter.post("/share-request", requestShareCredential);

shareRouter.post("/confirm-share", confirmShareCredential);

shareRouter.delete("/share/:credentialId/:targetUserId", deleteSharePermission);

shareRouter.patch("/:id/favorite", patchCredentialFav);

export default shareRouter;
