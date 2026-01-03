import crypto from "node:crypto";
import { promisify } from "node:util";

// Function to generate vaultKeySalt, publicKey and privateKey (encrypted)
const pbkdf2 = promisify(crypto.pbkdf2);

export const generateKeys = async (password) => {
  // 1. Generate a random salt for this user's vault
  const vaultKeySalt = crypto.randomBytes(16).toString("hex");

  // 2. Derive the Master Key ( ONLY for encrypting the private key)
  // We use 100,000 iterations for security
  const masterKey = await pbkdf2(password, vaultKeySalt, 100000, 32, "sha256");

  // 3. Generate RSA public–private key pair for sharing
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  // 4. Encrypt the Private Key with the Master Key (AES-256-GCM)
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", masterKey, iv);

  let encryptedPrivateKey = cipher.update(privateKey, "utf8", "hex");
  encryptedPrivateKey += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return {
    vaultKeySalt,
    publicKey,
    privateKey: `${encryptedPrivateKey}:${iv.toString("hex")}:${tag.toString(
      "hex"
    )}`,
  };
};

// Function to encrypt the credential data - using a Symmetric Key (AES-256-GCM)
export const encryptCredential = (data, key) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return {
    encryptedData: encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
};

// Function to encrypt the Symmetric Key with an RSA Public Key
export const encryptKeyWithPublicKey = (symmetricKey, publicKey) => {
  const bufferKey = Buffer.from(symmetricKey, "hex");
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    bufferKey
  );
  return encrypted.toString("hex");
};
