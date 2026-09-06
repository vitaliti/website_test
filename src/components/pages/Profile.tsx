import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "./Profile.css";

type ProfileData = {
  id: string;
  username: string;
  profile_picture_path: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

type Apartment = {
  id: string;
  city: string;
  neighborhood: string;
  price: number;
  floor: number;
  rooms: number;
  storage: boolean;
  ac: boolean;
  garage: boolean;
};

export default function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/sign-in");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("Profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError);
        setMessage("Failed to load profile.");
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setUsername(profileData.username);
      setBio(profileData.bio ?? "");

      const { data: apartmentData, error: apartmentError } = await supabase
        .from("Apartments")
        .select(
          "id, city, neighborhood, price, floor, rooms, storage, ac, garage"
        )
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });

      if (apartmentError) {
        console.error("Error loading apartments:", apartmentError);
        setMessage("Failed to load apartments.");
      } else {
        setApartments(apartmentData ?? []);
      }

      setLoading(false);
    }

    loadProfile();
  }, [navigate]);

  async function handleSaveProfile() {
    if (!profile) {
      return;
    }

    setSaving(true);
    setMessage("");

    const { data, error } = await supabase
      .from("Profiles")
      .update({
        username: username.trim(),
        bio: bio.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      setMessage("Failed to update profile.");
      setSaving(false);
      return;
    }

    setProfile(data);
    setUsername(data.username);
    setBio(data.bio ?? "");
    setEditing(false);
    setMessage("Profile updated successfully.");
    setSaving(false);
  }

  function handleCancelEdit() {
    if (!profile) {
      return;
    }

    setUsername(profile.username);
    setBio(profile.bio ?? "");
    setEditing(false);
    setMessage("");
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
      return;
    }

    navigate("/");
  }

  if (loading) {
    return <p className="profile-status">Loading...</p>;
  }

  if (!profile) {
    return <p className="profile-status">{message || "Profile not found."}</p>;
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString();

  return (
    <main className="profile-page">
      <div className="profile-container">

        <section className="profile-card">
          <div className="profile-header">

            <div className="profile-picture">
              {profile.profile_picture_path ? (
                <img
                  src={
                    supabase.storage
                      .from("profile-pictures")
                      .getPublicUrl(profile.profile_picture_path).data.publicUrl
                  }
                  alt="Profile"
                />
              ) : (
                <span>
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="profile-header-info">
              {!editing ? (
                <>
                  <h1>{profile.username}</h1>
                  <p className="profile-member">
                    Member since {memberSince}
                  </p>
                </>
              ) : (
                <h1>Edit Profile</h1>
              )}
            </div>

            {!editing && (
              <button
                className="profile-edit-button"
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </button>
            )}
          </div>

          {!editing ? (
            <>
              <div className="profile-bio">
                <h2>About</h2>
                <p>
                  {profile.bio || "No bio yet."}
                </p>
              </div>

              <div className="profile-stats">
                <div>
                  <strong>{apartments.length}</strong>
                  <span>Active Listings</span>
                </div>

                <div>
                  <strong>{memberSince}</strong>
                  <span>Member Since</span>
                </div>
              </div>
            </>
          ) : (
            <div className="profile-edit-form">
              <div className="profile-field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="profile-field">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={5}
                  placeholder="Tell people a little about yourself..."
                />
              </div>

              <div className="profile-edit-actions">
                <button
                  className="profile-save-button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  className="profile-cancel-button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {message && (
            <p className="profile-message">
              {message}
            </p>
          )}
        </section>

        <section className="profile-listings">
          <div className="profile-listings-header">
            <h2>Your Listings</h2>

            <button
              className="profile-create-button"
              onClick={() => navigate("/create-listing")}
            >
              Create Listing
            </button>
          </div>

          {apartments.length === 0 ? (
            <p className="profile-empty">
              You don't have any active listings yet.
            </p>
          ) : (
            <div className="profile-listings-grid">
              {apartments.map((apartment) => (
                <div
                  key={apartment.id}
                  className="profile-listing-card"
                  onClick={() =>
                    navigate(`/apartments/${apartment.id}`)
                  }
                >
                  <div className="profile-listing-info">
                    <div className="profile-listing-price">
                      {apartment.price} €
                      <span>/ month</span>
                    </div>

                    <h3>
                      {apartment.rooms} room
                      {apartment.rooms !== 1 ? "s" : ""} apartment
                    </h3>

                    <p>
                      {apartment.neighborhood}, {apartment.city}
                    </p>

                    <div className="profile-listing-details">
                      <span>Floor {apartment.floor}</span>

                      {apartment.storage && (
                        <span>Storage</span>
                      )}

                      {apartment.garage && (
                        <span>Garage</span>
                      )}

                      {apartment.ac && (
                        <span>AC</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="profile-account">
          <button
            className="profile-logout-button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </section>

      </div>
    </main>
  );
}
