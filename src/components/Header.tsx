// import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import homeIcon from "./../assets/home.svg";
import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <Link to="/">
        <div className="home-image">
          <img src={homeIcon} alt="Home" />
          <span>Sofia Homes</span>
        </div>
      </Link>
      <Link to="/sign-in">Sign in</Link>
      <Link to="/register">List your apartment</Link>
    </header>
  );
}

