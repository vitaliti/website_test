import { useState } from "react";
import "./SignIn.css";

export default function SignIn() {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <main className="auth">
      <h1>{isRegistering ? "Register" : "Sign in"}</h1>

      {isRegistering && (
        <input
          type="text"
          placeholder="Username"
        />
      )}

      <input
        type="email"
        placeholder="Email"
      />

      <input
        type="password"
        placeholder="Password"
      />

      <button className="auth-submit">
        {isRegistering ? "Register" : "Sign in"}
      </button>

      <p>
        {isRegistering
          ? "Already have an account?"
          : "Don't have an account?"}
      </p>

      <button
        className="auth-switch"
        onClick={() => setIsRegistering(!isRegistering)}
      >
        {isRegistering ? "Sign in instead" : "Register instead"}
      </button>
    </main>
  );
}
