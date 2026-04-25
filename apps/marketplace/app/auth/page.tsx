import { Suspense } from "react";

import { AuthFlow } from "../../components/auth-flow";

export const metadata = {
  title: "Sign in — Streets",
  description: "Join or sign in to Streets."
};

function AuthLoading() {
  return (
    <div className="authCard authCard--loading" aria-busy="true">
      <div className="authSpinner" />
      <p className="authLoadingText">Loading…</p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <main className="authPage">
      <div className="authSplit">
        <aside className="authBrand" aria-hidden="false">
          <div className="authBrandMesh" />
          <div className="authBrandContent">
            <p className="authBrandKicker">Streets</p>
            <h1 className="authBrandTitle">Where bookings feel human.</h1>
            <p className="authBrandCopy">
              Meet creators, lock in a time, and keep everything above board — one account for the
              feed and your wallet.
            </p>
            <ul className="authBrandList">
              <li>One tap back to your feed</li>
              <li>Creators and guests, same front door</li>
              <li>Protected payouts when you book</li>
            </ul>
          </div>
        </aside>
        <div className="authFormShell">
          <Suspense fallback={<AuthLoading />}>
            <AuthFlow />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
