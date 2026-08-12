import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Header.css";

export default function Header(): JSX.Element {
  return (
    <header className="header">
      <button>
        <Link to="/login">Sign in</Link>
      </button>
      <button>
        <Link to="/register">Get started</Link>
      </button>
    </header>
  );
}

