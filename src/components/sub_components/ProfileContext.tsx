import { createContext, useContext, useEffect, useState } from "react";
import * as db from "../services/DatabaseService";

type ProfileData = {
  id: string;
  username: string;
  profile_picture_path: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileContextType = {
  profile: ProfileData | null;
  loading: boolean;
  updateProfile: (profile: ProfileData) => void;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await db.getUser();
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error } = await db.getFullProfile(user.id);
      if (error) {
        console.error("Error loading profile:", error);
        setProfile(null);
      } else {
        setProfile(data);
      }

      setLoading(false);
    }

    loadProfile();

    const { data: { subscription } } = db.onAuthStateChange((session) => {
      if (!session) {
        setProfile(null);
      } else {
        loadProfile();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  function updateProfile(profile: ProfileData) {
    setProfile(profile);
  }

  return (
    <ProfileContext.Provider value={{ profile, loading, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfile must be used inside ProfileProvider");
  }

  return context;
}
