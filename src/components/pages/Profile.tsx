import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProfile } from "../../components/sub_components/ProfileContext";
import * as db from "../services/DatabaseService";

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
    const { id } = useParams();
    const { profile, loading: profileLoading, updateProfile } = useProfile();

    const [displayedProfile, setDisplayedProfile] = useState(profile);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const [apartments, setApartments] = useState<Apartment[]>([]);
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingPicture, setUploadingPicture] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProfilePage() {
            setLoading(true);
            setMessage("");

            const { data: { user } } = await db.getUser();
            if (user) {
                setCurrentUserId(user.id);
            }

            const profileId = id ?? user?.id;

            if (!profileId) {
                navigate("/sign-in");
                return;
            }

            const { data: profileData, error: profileError } = await db.getFullProfile(profileId);
            if (profileError) {
                console.error("Error loading profile:", profileError);
                setDisplayedProfile(null);
                setMessage("Profile not found.");
                setLoading(false);
                return;
            }

            setDisplayedProfile(profileData);

            const { data: apartmentData, error: apartmentError } = await db.getUserApartments(profileId);
            if (apartmentError) {
                console.error("Error loading apartments:", apartmentError);
                setMessage("Failed to load apartments.");
            } else {
                const apartmentsWithNeighborhoods = await Promise.all(
                    (apartmentData ?? []).map(async (apartment) => {
                        const { data: neighborhoodData, error: neighborhoodError } = await db.getNeighborhoodById(apartment.neighborhood_id);
                        if (neighborhoodError) {
                            console.error("Error loading neighborhood:", neighborhoodError);
                        }

                        return {
                            ...apartment,
                            neighborhood: neighborhoodData?.name ?? "",
                        };
                    })
                );

                setApartments(apartmentsWithNeighborhoods);
            }

            setLoading(false);
        }

        loadProfilePage();
    }, [id, navigate]);

    async function handlePictureChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];

        if (!file || !displayedProfile) {
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

        const filePath = `${displayedProfile.id}/${crypto.randomUUID()}-${file.name}`;

        const { error: uploadError } = await db.uploadProfilePicture(filePath, file);
        if (uploadError) {
            console.error("Error uploading profile picture:", uploadError);
            setMessage("Failed to upload profile picture.");
            setUploadingPicture(false);
            return;
        }

        const oldPicturePath = displayedProfile.profile_picture_path;
        const { data, error: updateError } = await db.updateProfilePicture(displayedProfile.id, filePath);
        if (updateError) {
            console.error("Error updating profile picture path:", updateError);
            await db.deleteProfileImage(filePath);
            setMessage("Failed to update profile picture.");
            setUploadingPicture(false);
            return;
        }

        if (oldPicturePath) {
            const { error: deleteError } = await db.deleteProfileImage(oldPicturePath);
            if (deleteError) {
                console.error("Error deleting old profile picture:", deleteError);
            }
        }

        setDisplayedProfile(data);
        updateProfile(data);
        setUploadingPicture(false);
        setMessage("Profile picture updated successfully.");

        event.target.value = "";
    }

    async function handleSaveProfile() {
        if (!displayedProfile) {
            return;
        }

        const trimmedUsername = username.trim();

        if (!trimmedUsername) {
            setMessage("Username cannot be empty.");
            return;
        }

        setSaving(true);
        setMessage("");

        const { data, error } = await db.updateProfile(
            displayedProfile.id,
            trimmedUsername,
            bio.trim() || null
        );

        if (error) {
            console.error("Error updating profile:", error);
            setMessage("Failed to update profile.");
            setSaving(false);
            return;
        }

        setDisplayedProfile(data);
        updateProfile(data);
        setUsername(data.username);
        setBio(data.bio ?? "");
        setEditing(false);
        setMessage("Profile updated successfully.");
        setSaving(false);
    }

    function handleCancelEdit() {
        if (!displayedProfile) {
            return;
        }

        setUsername(displayedProfile.username);
        setBio(displayedProfile.bio ?? "");
        setEditing(false);
        setMessage("");
    }

    async function handleLogout() {
        const { error } = await db.signOut();
        if (error) {
            console.error("Logout failed:", error);
            return;
        }

        navigate("/");
    }

    if (profileLoading || loading) {
        return <p className="profile-status">Loading...</p>;
    }

    if (!displayedProfile) {
        return (
            <p className="profile-status">
                {message || "Profile not found."}
            </p>
        );
    }

    const isOwnProfile = currentUserId === displayedProfile.id;
    const memberSince = new Date(displayedProfile.created_at).toLocaleDateString();
    const profilePictureUrl = displayedProfile.profile_picture_path ? db.getProfileImageUrl(displayedProfile.profile_picture_path) : null;

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
                                    <span>
                                        {displayedProfile.username
                                            .charAt(0)
                                            .toUpperCase()}
                                    </span>
                                )}
                            </div>

                            {isOwnProfile && editing && (
                                <>
                                    <label
                                        htmlFor="profile-picture"
                                        className="profile-picture-button"
                                    >
                                        {uploadingPicture
                                            ? "Uploading..."
                                            : "Change Picture"}
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
                            {!editing || !isOwnProfile ? (
                                <>
                                    <h1>{displayedProfile.username}</h1>
                                    <p className="profile-member">
                                        Member since {memberSince}
                                    </p>
                                </>
                            ) : (
                                <h1>Edit Profile</h1>
                            )}
                        </div>

                        {isOwnProfile && !editing && (
                            <button
                                className="profile-edit-button"
                                onClick={() => {
                                    setUsername(displayedProfile.username);
                                    setBio(displayedProfile.bio ?? "");
                                    setEditing(true);
                                }}
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {!editing || !isOwnProfile ? (
                        <>
                            <div className="profile-bio">
                                <h2>About</h2>
                                <p>{displayedProfile.bio || "No bio yet."}</p>
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
                        <h2>
                            {isOwnProfile ? "Your Listings" : "Listings"}
                        </h2>

                        {isOwnProfile && (
                            <button
                                className="profile-create-button"
                                onClick={() => navigate("/create-listing")}
                            >
                                Create Listing
                            </button>
                        )}
                    </div>

                    {apartments.length === 0 ? (
                        <p className="profile-empty">
                            {isOwnProfile
                                ? "You don't have any active listings yet."
                                : "This user doesn't have any active listings yet."}
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
                                            {apartment.neighborhood},{" "}
                                            {apartment.city}
                                        </p>

                                        <div className="profile-listing-details">
                                            <span>Floor {apartment.floor}</span>
                                            {apartment.storage && (
                                                <span>Storage</span>
                                            )}
                                            {apartment.garage && (
                                                <span>Garage</span>
                                            )}
                                            {apartment.ac && <span>AC</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {isOwnProfile && (
                    <section className="profile-account">
                        <button
                            className="profile-logout-button"
                            onClick={handleLogout}
                        >
                            Log out
                        </button>
                    </section>
                )}
            </div>
        </main>
    );
}
