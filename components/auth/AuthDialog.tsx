"use client";

import { FormEvent, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  backendOnline: boolean | null;
  backendUrl: string;
}

export function AuthDialog({
  open,
  onOpenChange,
  onSignIn,
  onSignUp,
  loading,
  error,
  backendOnline,
  backendUrl,
}: AuthDialogProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "signin") {
      await onSignIn(email, password);
    } else {
      await onSignUp(email, password);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "signin" ? "Sign in to save" : "Create account"}</DialogTitle>
          <DialogDescription>
            Camera preview works as a guest. Saving and restoring beacons uses PocketBase email/password
            auth.
          </DialogDescription>
        </DialogHeader>

        <div className={cn("auth-backend-status", backendOnline === false && "offline")}>
          <strong>{backendOnline === false ? "PocketBase offline" : "PocketBase backend"}</strong>
          <span>{backendUrl}</span>
          {backendOnline === false ? <p>Start PocketBase before signing in or creating an account.</p> : null}
        </div>

        <div className="segmented-control" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            className={cn(mode === "signin" && "active")}
            onClick={() => setMode("signin")}
          >
            <LogIn size={15} />
            Sign in
          </button>
          <button
            type="button"
            className={cn(mode === "signup" && "active")}
            onClick={() => setMode("signup")}
          >
            <UserPlus size={15} />
            Sign up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field-stack">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="field-stack">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <Button type="submit" variant="primary" disabled={loading || backendOnline === false}>
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
