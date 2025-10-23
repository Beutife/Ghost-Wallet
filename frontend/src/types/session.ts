/**
 * TYPE DEFINITIONS FOR SESSIONS
 */

export interface Session {
  ghostAddress: `0x${string}`;
  sessionKey: `0x${string}`; // Ephemeral key address
  expiresAt: number;
  isActive: boolean;
  startedAt: number;
}

export interface PasswordState {
  hasPassword: boolean;
  isUnlocked: boolean;
  unlockedUntil?: number;
}

export interface EphemeralKey {
  publicKey: `0x${string}`;
  privateKey: string;
  encrypted: string; // Encrypted version stored locally
}