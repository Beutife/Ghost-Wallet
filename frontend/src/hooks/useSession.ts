/**
 * MANAGES SESSION STATE
 * - Checks if user has master password
 * - Tracks active sessions
 * - Handles session expiry
 */
"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

export function useSession() {
  const { address } = useAccount();
  const [hasPassword, setHasPassword] = useState(false);
  const [activeSessions, setActiveSessions] = useState<string[]>([]);

  // Check if user has created master password
  useEffect(() => {
    if (!address) return;

    const passwordHash = localStorage.getItem(`password_${address}`);
    setHasPassword(!!passwordHash);
  }, [address]);

  // Load active sessions from sessionStorage
  useEffect(() => {
    const sessions: string[] = [];
    
    // Check sessionStorage for active sessions
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith("session_")) {
        const ghostAddress = key.replace("session_", "");
        const sessionData = sessionStorage.getItem(key);
        
        if (sessionData) {
          try {
            const parsed = JSON.parse(sessionData);
            const now = Date.now() / 1000;
            
            // Only include active sessions
            if (parsed.expiresAt > now) {
              sessions.push(ghostAddress);
            } else {
              // Clean up expired sessions
              sessionStorage.removeItem(key);
            }
          } catch (error) {
            console.error("Failed to parse session:", error);
          }
        }
      }
    }
    
    setActiveSessions(sessions);
  }, []);

  // Check if specific ghost has active session
  const isSessionActive = (ghostAddress: string): boolean => {
    return activeSessions.includes(ghostAddress);
  };

  // Get session expiry for specific ghost
  const getSessionExpiry = (ghostAddress: string): number | null => {
    const sessionData = sessionStorage.getItem(`session_${ghostAddress}`);
    if (!sessionData) return null;

    try {
      const parsed = JSON.parse(sessionData);
      return parsed.expiresAt;
    } catch {
      return null;
    }
  };

  // End session manually
  const endSession = (ghostAddress: string) => {
    sessionStorage.removeItem(`session_${ghostAddress}`);
    setActiveSessions(prev => prev.filter(addr => addr !== ghostAddress));
  };

  // Clear all sessions
  const clearAllSessions = () => {
    activeSessions.forEach(ghostAddress => {
      sessionStorage.removeItem(`session_${ghostAddress}`);
    });
    setActiveSessions([]);
  };

  return {
    hasPassword,
    activeSessions,
    isSessionActive,
    getSessionExpiry,
    endSession,
    clearAllSessions,
  };
}