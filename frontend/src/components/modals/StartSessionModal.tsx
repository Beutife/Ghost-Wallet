// src/components/modals/StartSessionModal.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { decryptEphemeralKey, addSessionKey } from "@/lib/ephemeral-keys";

interface StartSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ghostAddress: string;
  onSuccess: () => void;
}

export default function StartSessionModal({
  open,
  onOpenChange,
  ghostAddress,
  onSuccess,
}: StartSessionModalProps) {
  const [password, setPassword] = useState("");
  const [duration, setDuration] = useState(3600);
  const [loading, setLoading] = useState(false);

  const durations = [
    { label: "1 Hour", value: 3600 },
    { label: "6 Hours", value: 21600 },
    { label: "12 Hours", value: 43200 },
    { label: "24 Hours", value: 86400 },
  ];

  const handleStartSession = async () => {
    if (!password) {
      toast.error("Please enter your master password");
      return;
    }

    setLoading(true);

    try {
      const ephemeralKey = await decryptEphemeralKey(ghostAddress, password);
      if (!ephemeralKey) {
        toast.error("Invalid password or key not found");
        setLoading(false);
        return;
      }

      const expiresAt = Math.floor(Date.now() / 1000) + duration;
      await addSessionKey(ghostAddress, ephemeralKey.publicKey, expiresAt);

      sessionStorage.setItem(
        `session_${ghostAddress}`,
        JSON.stringify({
          key: ephemeralKey.privateKey,
          expiresAt,
        })
      );

      toast.success("Session started successfully!");
      onSuccess();
      onOpenChange(false);
      setPassword("");
    } catch (error) {
      console.error("Failed to start session:", error);
      toast.error("Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start Session</DialogTitle>
          <DialogDescription>
            Enter your master password to unlock this ghost wallet for a limited time
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Master Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your master password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This password decrypts your ephemeral key locally
            </p>
          </div>
          <div className="space-y-2">
            <Label>Session Duration</Label>
            <div className="grid grid-cols-2 gap-2">
              {durations.map((d) => (
                <Button
                  key={d.value}
                  variant={duration === d.value ? "default" : "outline"}
                  onClick={() => setDuration(d.value)}
                  className="w-full"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {d.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-duration">Custom Duration (hours)</Label>
            <Input
              id="custom-duration"
              type="number"
              min="1"
              max="168"
              placeholder="Enter custom hours"
              onChange={(e) => setDuration(parseInt(e.target.value) * 3600)}
            />
          </div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your session will automatically end after {duration / 3600} hour(s).
              You can manually end it anytime from the dashboard.
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleStartSession} disabled={loading}>
            {loading ? "Starting..." : "Start Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}