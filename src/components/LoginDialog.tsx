import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getUserFacingConvexError } from "../lib/convexError";
import { useLanguage } from "../lib/LanguageContext";

type Flow = "signIn" | "signUp";

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

export function LoginDialog({ open, onClose }: LoginDialogProps) {
  const { t } = useLanguage();
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

      // Store user ID in localStorage for dev mode auth
      if (result?.userId) {
        localStorage.setItem("userId", result.userId);
        // Reload page to update auth state
        window.location.reload();
      }

      // Success - close dialog
      resetForm();
      onClose();
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
          <h2>{flow === "signIn" ? t('login.signIn') : t('login.createAccount')}</h2>
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
              <label htmlFor="login-name">{t('login.displayName')}</label>
              <input
                id="login-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('login.displayNamePlaceholder')}
                autoComplete="name"
              />
            </div>
          )}

          <div className="login-field">
            <label htmlFor="login-email">{t('login.email')}</label>
            <input
              ref={emailRef}
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
              required
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">{t('login.password')}</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={flow === "signUp" ? "At least 8 characters" : t('login.passwordPlaceholder')}
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
              ? t('common.loading')
              : flow === "signIn"
                ? t('login.signInBtn')
                : t('login.signUpBtn')}
          </button>
        </form>

        <div className="login-dialog-footer">
          {flow === "signIn" ? (
            <p>
              {t('login.dontHaveAccount')}{" "}
              <button type="button" className="login-switch" onClick={() => switchFlow("signUp")}>
                {t('login.signUpLink')}
              </button>
            </p>
          ) : (
            <p>
              {t('login.haveAccount')}{" "}
              <button type="button" className="login-switch" onClick={() => switchFlow("signIn")}>
                {t('login.signInLink')}
              </button>
            </p>
          )}
        </div>
      </div>
    </dialog>
  );
}
