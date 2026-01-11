import { prisma } from "../config/prisma.client.js";

export const getCredentialAccessList = async (req, res, next) => {
  try {
    const { id } = req.params; // Credential ID
    const userId = req.user.id; // From your auth middleware

    // Verify requester has access to this credential before showing the list
    const hasPermission = await prisma.permission.findFirst({
      where: {
        credentialId: id,
        userId: userId,
      },
    });

    if (!hasPermission) {
      const error = new Error(
        "Unauthorized: You do not have access to this credential"
      );
      error.statusCode = 403;
      throw error;
    }

    const permissions = await prisma.permission.findMany({
      where: { credentialId: id },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    res.status(200).json({ success: true, data: permissions });
  } catch (err) {
    next(err);
  }
};

export const requestShareCredential = async (req, res, next) => {
  try {
    const { credentialId, targetEmail } = req.body;
    const ownerId = req.user.id;

    // 1. Find the target user to get their Public Key
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail },
      select: { id: true, publicKey: true },
    });

    if (!targetUser) {
      const error = new Error("User with that email not found");
      error.statusCode = 404;
      throw error;
    }

    const ownerPermission = await prisma.permission.findUnique({
      where: {
        userId_credentialId: {
          userId: ownerId,
          credentialId: credentialId,
        },
      },
    });

    if (!ownerPermission) {
      const error = new Error(
        "You do not have permission to share this credential"
      );
      error.statusCode = 403;
      throw error;
    }

    // 3. Check if it's already shared with them
    const existingPermission = await prisma.permission.findUnique({
      where: {
        userId_credentialId: {
          userId: targetUser.id,
          credentialId: credentialId,
        },
      },
    });

    if (existingPermission) {
      return res
        .status(200)
        .json({ success: true, message: "Already shared with this user" });
    }

    /* STOP! Security Moment:
       The Backend cannot re-encrypt the Data Key because the Backend doesn't have the 
       Private Key. The Backend should send the Target's Public Key back to the 
       Frontend, and the Frontend does the "Wrapping."
    */

    res.status(200).json({
      success: true,
      message:
        "Target user found. Please encrypt the Data Key with this Public Key.",
      data: {
        targetUserId: targetUser.id,
        targetPublicKey: targetUser.publicKey,
        // The frontend needs the original encryptedDataKey to decrypt it first
        encryptedDataKey: ownerPermission.encryptedDataKey,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const confirmShareCredential = async (req, res, next) => {
  try {
    const { credentialId, targetUserId, newlyEncryptedDataKey, iv } = req.body;

    const newPermission = await prisma.permission.create({
      data: {
        userId: targetUserId,
        credentialId: credentialId,
        encryptedDataKey: newlyEncryptedDataKey,
        iv: iv || "", // The IV used during the Public Key encryption
      },
    });

    res.status(201).json({
      success: true,
      message: "Access granted successfully",
      data: newPermission,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteSharePermission = async (req, res, next) => {
  try {
    const { credentialId, targetUserId } = req.params;
    const requesterId = req.user.id; // The person clicking "Unshare"

    // 1. Verify the Requester is the OWNER of the credential
    // Only the owner should be allowed to kick people out.
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
    });

    if (!credential || credential.userId !== requesterId) {
      const error = new Error("Unauthorized: Only the owner can revoke access");
      error.statusCode = 403;
      throw error;
    }

    // 2. Prevent the owner from accidentally unsharing with themselves
    if (targetUserId === requesterId) {
      const error = new Error(
        "You cannot revoke your own access. Delete the credential instead."
      );
      error.statusCode = 400;
      throw error;
    }

    // 3. Delete the specific permission record
    await prisma.permission.delete({
      where: {
        userId_credentialId: {
          userId: targetUserId,
          credentialId: credentialId,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Access revoked successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const patchCredentialFav = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 1. Find the credential
    const credential = await prisma.credential.findUnique({
      where: { id },
    });

    // 2. Check ownership
    // Even if it's shared, usually only the owner manages "Favorite" status
    // unless you want favorites to be per-user (which would require moving 'favorite' to the Permission table)
    if (!credential || credential.userId !== userId) {
      const error = new Error("Credential not found or unauthorized");
      error.statusCode = 404;
      throw error;
    }

    // 3. Toggle the boolean
    const updatedCredential = await prisma.credential.update({
      where: { id },
      data: {
        favorite: !credential.favorite, // If true, becomes false. If false, becomes true.
      },
    });

    res.status(200).json({
      success: true,
      message: updatedCredential.favorite
        ? "Added to favorites"
        : "Removed from favorites",
      data: { favorite: updatedCredential.favorite },
    });
  } catch (err) {
    next(err);
  }
};
