import { ethers } from "ethers";

/**
 * Generate a new ephemeral keypair
 */
export function generateEphemeralKey() {
  const wallet = ethers.Wallet.createRandom();
  return {
    publicKey: wallet.address,
    privateKey: wallet.privateKey,
  };
}

/**
 * Encrypt ephemeral key with master password (client-side)
 */
export async function encryptEphemeralKey(
  privateKey: string,
  password: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(privateKey);

  // Derive key from password
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt ephemeral key with master password
 */
export async function decryptEphemeralKey(
  ghostAddress: string,
  password: string
): Promise<{ publicKey: string; privateKey: string } | null> {
  try {
    // Get encrypted key from IndexedDB
    const encryptedData = localStorage.getItem(`ghost_key_${ghostAddress}`);
    if (!encryptedData) return null;

    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );

    const privateKey = new TextDecoder().decode(decrypted);
    const wallet = new ethers.Wallet(privateKey);

    return {
      publicKey: wallet.address,
      privateKey,
    };
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}

/**
 * Add session key to smart contract
 */
export async function addSessionKey(
  ghostAddress: string,
  sessionKey: string,
  expiresAt: number
) {
  // TODO: Call GhostWallet.addEphemeralKey() via Wagmi
  // This will be implemented when you integrate ABIs
  console.log("Adding session key:", { ghostAddress, sessionKey, expiresAt });
}