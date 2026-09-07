import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useProfile } from "../../components/sub_components/ProfileContext";

import "./Profile.css";

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
  const { profile, loading: profileLoading, updateProfile } = useProfile();

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadApartments() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/sign-in");
        return;
      }

      const { data: apartmentData, error: apartmentError } = await supabase
        .from("Apartments")
        .select("id, city, neighborhood, price, floor, rooms, storage, ac, garage")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });

      if (apartmentError) {
        console.error("Error loading apartments:", apartmentError);
        setMessage("Failed to load apartments.");
      } else {
        setApartments(apartmentData ?? []);
      }
    }

    loadApartments();
  }, [navigate]);

  async function handlePictureChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !profile) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("The image must be smaller than 5 MB.");
      return;
    }

    setUploadingPicture(true);
    setMessage("");

    const filePath = `${profile.id}/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading profile picture:", uploadError);
      setMessage("Failed to upload profile picture.");
      setUploadingPicture(false);
      return;
    }

    const oldPicturePath = profile.profile_picture_path;

    const { data, error: updateError } = await supabase
      .from("Profiles")
      .update({
        profile_picture_path: filePath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating profile picture path:", updateError);

      await supabase.storage
        .from("profile-pictures")
        .remove([filePath]);

      setMessage("Failed to update profile picture.");
      setUploadingPicture(false);
      return;
    }

    if (oldPicturePath) {
      const { error: deleteError } = await supabase.storage
        .from("profile-pictures")
        .remove([oldPicturePath]);

      if (deleteError) {
        console.error("Error deleting old profile picture:", deleteError);
      }
    }

    updateProfile(data);
    setUploadingPicture(false);
    setMessage("Profile picture updated successfully.");

    event.target.value = "";
  }

  async function handleSaveProfile() {
    if (!profile) {
      return;
    }

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setMessage("Username cannot be empty.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { data, error } = await supabase
      .from("Profiles")
      .update({
        username: trimmedUsername,
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

    updateProfile(data);
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

  if (profileLoading) {
    return <p className="profile-status">Loading...</p>;
  }

  if (!profile) {
    return <p className="profile-status">{message || "Profile not found."}</p>;
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString();

  const profilePictureUrl = profile.profile_picture_path
    ? supabase.storage
        .from("profile-pictures")
        .getPublicUrl(profile.profile_picture_path).data.publicUrl
    : null;

  return (
    <main className="profile-page">
      <div className="profile-container">

        <section className="profile-card">
          <div className="profile-header">

            <div className="profile-picture-container">
              <div className="profile-picture">
                {profilePictureUrl ? (
                  <img src={profilePictureUrl} alt="Profile" />
                ) : (
                  <span>{profile.username.charAt(0).toUpperCase()}</span>
                )}
              </div>

              {editing && (
                <>
                  <label htmlFor="profile-picture" className="profile-picture-button">
                    {uploadingPicture ? "Uploading..." : "Change Picture"}
                  </label>

                  <input
                    id="profile-picture"
                    type="file"
                    accept="image/*"
                    onChange={handlePictureChange}
                    disabled={uploadingPicture}
                    hidden
                  />
                </>
              )}
            </div>

            <div className="profile-header-info">
              {!editing ? (
                <>
                  <h1>{profile.username}</h1>
                  <p className="profile-member">Member since {memberSince}</p>
                </>
              ) : (
                <h1>Edit Profile</h1>
              )}
            </div>

            {!editing && (
              <button
                className="profile-edit-button"
                onClick={() => {
                  setUsername(profile.username);
                  setBio(profile.bio ?? "");
                  setEditing(true);
                }}
              >
                Edit Profile
              </button>
            )}
          </div>

          {!editing ? (
            <>
              <div className="profile-bio">
                <h2>About</h2>
                <p>{profile.bio || "No bio yet."}</p>
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
                  disabled={saving || uploadingPicture}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  className="profile-cancel-button"
                  onClick={handleCancelEdit}
                  disabled={saving || uploadingPicture}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {message && <p className="profile-message">{message}</p>}
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
            <p className="profile-empty">You don't have any active listings yet.</p>
          ) : (
            <div className="profile-listings-grid">
              {apartments.map((apartment) => (
                <div
                  key={apartment.id}
                  className="profile-listing-card"
                  onClick={() => navigate(`/apartments/${apartment.id}`)}
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

                      {apartment.storage && <span>Storage</span>}
                      {apartment.garage && <span>Garage</span>}
                      {apartment.ac && <span>AC</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="profile-account">
          <button className="profile-logout-button" onClick={handleLogout}>
            Log out
          </button>
        </section>

      </div>
    </main>
  );
}
