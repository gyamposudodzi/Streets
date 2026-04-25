"use client";

import type { FormEvent } from "react";

import { ApiClientError, loginUser, registerUser } from "@streets/api-client";
import type { AuthSession } from "@streets/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  clearAuthSession,
  readAuthSession,
  saveAuthSession,
  validateAuthSession
} from "../lib/auth-session";
import { SocialAvatar } from "./social-avatar";

type AuthMode = "signin" | "signup";

const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

function safeReturnPath(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/";
}

export function AuthFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get("next"));

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"user" | "creator">("user");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);

  const syncSession = useCallback(() => {
    setSession(readAuthSession());
  }, []);

  useEffect(() => {
    syncSession();
    let cancelled = false;
    (async () => {
      const raw = readAuthSession();
      if (raw?.access_token) {
        const next = await validateAuthSession();
        if (!cancelled) {
          setSession(next);
        }
      }
      if (!cancelled) {
        setIsHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [syncSession]);

  useEffect(() => {
    const onAuth = () => syncSession();
    window.addEventListener("streets-auth-changed", onAuth);
    return () => window.removeEventListener("streets-auth-changed", onAuth);
  }, [syncSession]);

  function mapError(err: unknown, context: AuthMode): string {
    if (err instanceof ApiClientError) {
      if (context === "signin" && err.status === 404) {
        return "No account for that email yet. Switch to Join to create one.";
      }
      if (context === "signup" && err.status === 409) {
        return "That email is already here. Sign in instead.";
      }
      if (err.detail) {
        return err.detail;
      }
    }
    return context === "signin"
      ? "Couldn’t sign you in. Check the API is running and try again."
      : "Couldn’t create your account. Try again in a moment.";
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setError("");
    setFieldError("");
    const trimmed = email.trim();
    if (!emailOk(trimmed)) {
      setFieldError("Enter a valid email.");
      return;
    }
    setIsBusy(true);
    try {
      const nextSession = await loginUser({ email: trimmed });
      saveAuthSession(nextSession);
      setSession(nextSession);
      router.replace(returnTo);
      router.refresh();
    } catch (err) {
      setError(mapError(err, "signin"));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setError("");
    setFieldError("");
    const trimmed = email.trim();
    if (!emailOk(trimmed)) {
      setFieldError("Enter a valid email.");
      return;
    }
    if (!ageConfirmed) {
      setFieldError("Please confirm age to continue.");
      return;
    }
    setIsBusy(true);
    try {
      await registerUser({
        email: trimmed,
        phone: phone.trim() || undefined,
        role,
        is_age_verified: true
      });
      const nextSession = await loginUser({ email: trimmed });
      saveAuthSession(nextSession);
      setSession(nextSession);
      router.replace(returnTo);
      router.refresh();
    } catch (err) {
      setError(mapError(err, "signup"));
      if (err instanceof ApiClientError && err.status === 409) {
        setMode("signin");
      }
    } finally {
      setIsBusy(false);
    }
  }

  function handleSignOut() {
    clearAuthSession();
    setSession(null);
    router.refresh();
  }

  if (isHydrating) {
    return (
      <div className="authCard authCard--loading" aria-busy="true">
        <div className="authSpinner" />
        <p className="authLoadingText">Loading your session…</p>
      </div>
    );
  }

  if (session) {
    const u = session.user;
    const isCreator = u.role === "creator";
    return (
      <div className="authCard">
        <div className="authSignedIn">
          <SocialAvatar id={u.id} name={u.email} size="xl" />
          <div>
            <p className="authSignedInLabel">You&apos;re in</p>
            <p className="authSignedInEmail">{u.email}</p>
            <p className="authSignedInRole">
              {isCreator ? "Creator" : "Member"} · {u.is_age_verified ? "Age OK" : "Age pending"}
            </p>
          </div>
        </div>
        <div className="authSignedInActions">
          <Link className="buttonLink authBtnWide" href="/">
            Back to feed
          </Link>
          {isCreator ? (
            <Link className="button secondaryButton authBtnWide" href="/creator">
              Your page
            </Link>
          ) : (
            <Link className="button secondaryButton authBtnWide" href="/search">
              Explore
            </Link>
          )}
          <button className="authSignOut" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="authCard">
      <div className="authTabs" role="tablist" aria-label="Sign in or join">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          className={`authTab${mode === "signin" ? " authTab--active" : ""}`}
          onClick={() => {
            setMode("signin");
            setError("");
            setFieldError("");
          }}
          disabled={isBusy}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={`authTab${mode === "signup" ? " authTab--active" : ""}`}
          onClick={() => {
            setMode("signup");
            setError("");
            setFieldError("");
          }}
          disabled={isBusy}
        >
          Join Streets
        </button>
      </div>

      {mode === "signin" ? (
        <form className="authForm" onSubmit={handleSignIn} noValidate>
          <p className="authLead">Welcome back — use the email you signed up with.</p>
          <label className="authField">
            <span className="authLabel">Email</span>
            <input
              className="input authInput"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="you@email.com"
              disabled={isBusy}
            />
          </label>
          {fieldError || error ? (
            <p className="errorText authError" role="alert">
              {fieldError || error}
            </p>
          ) : null}
          <button className="button authSubmit" type="submit" disabled={isBusy}>
            {isBusy ? "Signing you in…" : "Continue"}
          </button>
          <p className="authFinePrint">
            Dev note: there&apos;s no password yet — email is your key. Production will add secure
            sign-in.
          </p>
        </form>
      ) : (
        <form className="authForm" onSubmit={handleSignUp} noValidate>
          <p className="authLead">Create a profile and start booking or hosting.</p>
          <label className="authField">
            <span className="authLabel">Email</span>
            <input
              className="input authInput"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="you@email.com"
              disabled={isBusy}
            />
          </label>
          <label className="authField">
            <span className="authLabel">Phone (optional)</span>
            <input
              className="input authInput"
              type="tel"
              name="phone"
              autoComplete="tel"
              value={phone}
              onChange={(ev) => setPhone(ev.target.value)}
              placeholder="For reminders later"
              disabled={isBusy}
            />
          </label>
          <div className="authField">
            <span className="authLabel">I want to</span>
            <div className="authRolePick">
              <button
                type="button"
                className={`authRoleBtn${role === "user" ? " authRoleBtn--on" : ""}`}
                onClick={() => setRole("user")}
                disabled={isBusy}
              >
                Book people
              </button>
              <button
                type="button"
                className={`authRoleBtn${role === "creator" ? " authRoleBtn--on" : ""}`}
                onClick={() => setRole("creator")}
                disabled={isBusy}
              >
                Host &amp; sell
              </button>
            </div>
          </div>
          <label className="authCheck">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(ev) => setAgeConfirmed(ev.target.checked)}
              disabled={isBusy}
            />
            <span>
              I&apos;m 18+ and agree to follow Streets&apos; community and safety expectations.
            </span>
          </label>
          {fieldError || error ? (
            <p className="errorText authError" role="alert">
              {fieldError || error}
            </p>
          ) : null}
          <button className="button authSubmit" type="submit" disabled={isBusy}>
            {isBusy ? "Creating your space…" : "Create account"}
          </button>
        </form>
      )}

      <p className="authBack">
        <Link href="/">← Feed</Link>
      </p>
    </div>
  );
}
