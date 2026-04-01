import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getUserFacingConvexError } from "../lib/convexError";

type Flow = "signIn" | "signUp";

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

export function LoginDialog({ open, onClose }: LoginDialogProps) {
  const registerUser = useMutation(api.simpleAuth.registerUser);
  const loginUser = useMutation(api.simpleAuth.loginUser);
  const [flow, setFlow] = useState<Flow>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
      requestAnimationFrame(() => emailRef.current?.focus());
    } else {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const resetForm = useCallback(() => {
    setEmail("");
    setPassword("");
    setName("");
    setError(null);
    setLoading(false);
  }, []);

  const switchFlow = useCallback(
    (next: Flow) => {
      setFlow(next);
      setError(null);
    },
    [],
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose();
        resetForm();
      }
    },
    [onClose, resetForm],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;

      if (flow === "signUp") {
        // Registration flow
        result = await registerUser({
          email,
          password,
          name,
        });
      } else {
        // Login flow
        result = await loginUser({
          email,
          password,
        });
      }

      // Success - close dialog
      resetForm();
      onClose();

      // Store user ID in localStorage for dev mode auth
      if (result?.userId) {
        localStorage.setItem("userId", result.userId);
      }
    } catch (err) {
      const message = getUserFacingConvexError(
        err,
        flow === "signIn"
          ? "Invalid email or password."
          : "Sign up failed. The email may already be in use.",
      );
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <dialog ref={dialogRef} className="login-dialog" onClick={handleBackdropClick}>
      <div className="login-dialog-content">
        <div className="login-dialog-header">
          <h2>{flow === "signIn" ? "Sign In" : "Create Account"}</h2>
          <button
            className="login-dialog-close"
            type="button"
            onClick={handleClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-dialog-form">
          {flow === "signUp" && (
            <div className="login-field">
              <label htmlFor="login-name">Display Name</label>
              <input
                id="login-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                autoComplete="name"
              />
            </div>
          )}

          <div className="login-field">
            <label htmlFor="login-email">Email</label>
            <input
              ref={emailRef}
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={flow === "signUp" ? "At least 8 characters" : "Your password"}
              required
              minLength={flow === "signUp" ? 8 : undefined}
              autoComplete={flow === "signIn" ? "current-password" : "new-password"}
            />
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : flow === "signIn"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <div className="login-dialog-footer">
          {flow === "signIn" ? (
            <p>
              Don&apos;t have an account?{" "}
              <button type="button" className="login-switch" onClick={() => switchFlow("signUp")}>
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button type="button" className="login-switch" onClick={() => switchFlow("signIn")}>
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </dialog>
  );
}
