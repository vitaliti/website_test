import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useProfile } from "./../components/sub_components/ProfileContext";
import homeIcon from "../assets/home.svg";
import profileIcon from "../assets/profile.svg";
import chatIcon from "../assets/chat.svg";

import "./Header.css";

export default function Header() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const { profile } = useProfile();

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

    const profilePictureUrl = profile?.profile_picture_path
        ? supabase.storage
              .from("profile-pictures")
              .getPublicUrl(profile.profile_picture_path).data.publicUrl
        : null;

    return (
        <header className="header">
            <Link to="/">
                <div className="home-image">
                    <img src={homeIcon} alt="Home" />
                    <span>Sofia Homes</span>
                </div>
            </Link>

            {isLoggedIn ? (
                <>
                    <Link to="/chat" className="chat-button">
                        <img src={chatIcon} alt="Chat" />
                    </Link>

                    <Link to="/profile" className="profile-button">
                        {profilePictureUrl ? (
                            <img src={profilePictureUrl} alt="Profile" />
                        ) : (
                            <img src={profileIcon} alt="Profile" />
                        )}
                    </Link>
                </>
            ) : (
                <Link to="/sign-in">Sign in</Link>
            )}

            <Link to="/my-apartments">List your apartment</Link>
        </header>
    );
}
