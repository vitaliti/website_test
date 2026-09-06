import { useState } from "react";
import "./SignIn.css";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function SignIn() {
  const [isRegistering, setIsRegistering] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function handleSubmit() {
    setMessage("");

    if (isRegistering) {
      // Register
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Registration successful! Check your email.");
    } else {
      // Sign in
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      navigate("/profile");
    }
  }

  return (
    <main className="auth">
      <h1>{isRegistering ? "Register" : "Sign in"}</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button className="auth-submit" onClick={handleSubmit}>
        {isRegistering ? "Register" : "Sign in"}
      </button>

      {message && <p>{message}</p>}

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
