import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import homeIcon from "./../assets/home.svg";
import profileIcon from "./../assets/profile.svg";
import "./Header.css";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="header">
      <Link to="/">
        <div className="home-image">
          <img src={homeIcon} alt="Home" />
          <span>Sofia Homes</span>
        </div>
      </Link>
      {isLoggedIn ? (
        <Link to="/profile" className="profile-button">
          <img src={profileIcon} alt="Profile" />
        </Link>
      ) : (
        <Link to="/sign-in">Sign in</Link>
      )}
      <Link to="/my-apartments">List your apartment</Link>
    </header>
  );
}

