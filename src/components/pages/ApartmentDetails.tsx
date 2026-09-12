import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import profileIcon from "../../assets/profile.svg";
import chatIcon from "../../assets/chat.svg";
import "./ApartmentDetails.css";
import * as db from "../services/DatabaseService";

type CreatorProfile = {
    id: string;
    profile_picture_path: string | null;
};

type ApartmentImage = {
    id: string;
    apartment_id: string;
    image_path: string;
};

type Apartment = {
    id: string;
    creator_id: string;
    city: string;
    neighborhood: string;
    price: number;
    floor: number;
    rooms: number;
    storage: boolean;
    ac: boolean;
    garage: boolean;
    images: ApartmentImage[];
};

export default function ApartmentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [creatorProfile, setCreatorProfile] =
        useState<CreatorProfile | null>(null);
    const [apartment, setApartment] = useState<Apartment | null>(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        async function loadApartment() {
            if (!id) {
                setError("Apartment not found.");
                setLoading(false);
                return;
            }

            const {
                data: { user },
            } = await db.getUser();

            setCurrentUserId(user?.id ?? null);

            const { data: apartmentData, error: apartmentError } = await db.getApartmentById(id);
            if (apartmentError) {
                console.error("Error loading apartment:", apartmentError);
                setError("Failed to load apartment.");
                setLoading(false);
                return;
            }

            const { data: neighborhoodData, error: neighborhoodError } = await db.getNeighborhoodById(apartmentData.neighborhood_id);
            if (neighborhoodError) {
                console.error(
                    "Error loading neighborhood:",
                    neighborhoodError
                );
                setError("Failed to load neighborhood.");
                setLoading(false);
                return;
            }

            const { data: creatorData, error: creatorError } = await db.getProfile(apartmentData.creator_id);
            if (creatorError) {
                console.error("Error loading creator profile:", creatorError);
            } else {
                setCreatorProfile(creatorData);
            }

            const { data: imagesData, error: imagesError } = await db.getApartmentImages(id);
            if (imagesError) {
                console.error(
                    "Error loading apartment images:",
                    imagesError
                );
                setError("Failed to load apartment images.");
                setLoading(false);
                return;
            }

            setApartment({
                ...apartmentData,
                neighborhood: neighborhoodData.name,
                images: imagesData ?? [],
            });

            setLoading(false);
        }

        loadApartment();
    }, [id]);

    async function handleStartChat() {
        if (!currentUserId || !apartment) {
            return;
        }

        const otherUserId = apartment.creator_id;

        if (currentUserId === otherUserId) {
            return;
        }

        const user1Id =
            currentUserId < otherUserId
                ? currentUserId
                : otherUserId;

        const user2Id =
            currentUserId < otherUserId
                ? otherUserId
                : currentUserId;

        const { data: existingConversation, error: conversationError } = await db.getConversationBetweenUsers(user1Id, user2Id);
        if (conversationError) {
            console.error(
                "Error checking conversation:",
                conversationError
            );
            return;
        }

        if (existingConversation) {
            navigate(
                `/chat?conversation=${existingConversation.id}`
            );
            return;
        }

        navigate(`/chat?user=${otherUserId}`);
    }

    if (loading) {
        return (
            <main className="apartment-details-page">
                <p>Loading...</p>
            </main>
        );
    }

    if (error || !apartment) {
        return (
            <main className="apartment-details-page">
                <p className="apartment-details-error">
                    {error || "Apartment not found."}
                </p>

                <button onClick={() => navigate("/my-apartments")}>
                    Back to My Apartments
                </button>
            </main>
        );
    }

    const selectedImageData = apartment.images[selectedImage];
    const selectedImageUrl = selectedImageData ? db.getApartmentImageUrl(selectedImageData.image_path) : null;

    async function handleDelete() {
        if (!id) return;

        const confirmed = window.confirm(
            "Are you sure you want to delete this apartment?"
        );

        if (!confirmed) return;

        const { data: { user } } = await db.getUser();
        if (!user) {
            console.error("User is not logged in.");
            return;
        }

        const { data: apartmentData, error: apartmentCheckError } =  await db.getApartmentById(id);
        if (apartmentCheckError) {
            console.error(
                "Error checking apartment ownership:",
                apartmentCheckError
            );
            return;
        }

        if (apartmentData.creator_id !== user.id) {
            console.error("User is not allowed to delete this apartment.");
            return;
        }

        const { data: images, error: imagesError } = await db.getApartmentImages(id);
        if (imagesError) {
            console.error("Error loading apartment images:", imagesError);
            return;
        }

        if (images && images.length > 0) {
            const imagePaths = images.map((image) => image.image_path);
            const { error: storageError } = await db.deleteApartmentImages(imagePaths);
            if (storageError) {
                console.error(
                    "Error deleting apartment images:",
                    storageError
                );
                return;
            }
        }

        const apartmentFolder = `${user.id}/${id}`;
        const { data: folderContents, error: folderListError } = await db.listApartmentFolder(apartmentFolder);
        if (folderListError) {
            console.error(
                "Error checking apartment folder:",
                folderListError
            );
            return;
        }

        const emptyFolderPlaceholder = folderContents?.find(
            (file) => file.name === ".emptyFolderPlaceholder"
        );

        if (emptyFolderPlaceholder) {
            const { error: placeholderDeleteError } = await db.deleteApartmentFolderPlaceholder(apartmentFolder);
            if (placeholderDeleteError) {
                console.error(
                    "Error deleting apartment folder placeholder:",
                    placeholderDeleteError
                );
                return;
            }
        }

        const { error: imageRecordsError } = await db.deleteApartmentImageRecords(id);
        if (imageRecordsError) {
            console.error(
                "Error deleting apartment image records:",
                imageRecordsError
            );
            return;
        }

        const { error: apartmentDeleteError } = await db.deleteApartment(id, user.id);
        if (apartmentDeleteError) {
            console.error(
                "Error deleting apartment:",
                apartmentDeleteError
            );
            return;
        }

        navigate("/my-apartments");
    }

    return (
        <main className="apartment-details-page">
            <div className="apartment-details-container">
                <button
                    className="back-button"
                    onClick={() => navigate("/my-apartments")}
                >
                    ← Back to My Apartments
                </button>

                <div className="apartment-details-card">
                    <div className="apartment-details-image">
                        {selectedImageUrl ? (
                            <img
                                src={selectedImageUrl}
                                alt={`${apartment.city}, ${apartment.neighborhood}`}
                            />
                        ) : (
                            <span>No image available</span>
                        )}
                    </div>

                    {apartment.images.length > 1 && (
                        <div className="apartment-details-thumbnails">
                            {apartment.images.map((image, index) => {
                                const imageUrl = db.getApartmentImageUrl(image.image_path);
                                return (
                                    <button
                                        key={image.id}
                                        onClick={() =>
                                            setSelectedImage(index)
                                        }
                                        className={
                                            index === selectedImage
                                                ? "apartment-thumbnail selected"
                                                : "apartment-thumbnail"
                                        }
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={`Apartment ${index + 1}`}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="apartment-details-content">
                        {creatorProfile && (
                            <div className="apartment-creator-actions">
                                <Link
                                    to={`/profile/${creatorProfile.id}`}
                                    className="apartment-creator"
                                >
                                    {creatorProfile.profile_picture_path ? (
                                        <img
                                            src={db.getProfileImageUrl(creatorProfile.profile_picture_path)}
                                            alt="Listing creator"
                                        />
                                    ) : (
                                        <img
                                            src={profileIcon}
                                            alt="Listing creator"
                                        />
                                    )}
                                </Link>

                                {currentUserId && currentUserId !== creatorProfile.id && (
                                    <button
                                        className="apartment-chat-button"
                                        onClick={handleStartChat}
                                    >
                                        <img
                                            src={chatIcon}
                                            alt="Start chat"
                                        />
                                    </button>
                                )}
                            </div>
                        )}

                        {currentUserId === apartment.creator_id && (
                            <div className="apartment-owner-actions">
                                <button
                                    onClick={() =>
                                        navigate(
                                            `/apartments/${apartment.id}/edit`
                                        )
                                    }
                                >
                                    Edit
                                </button>

                                <button onClick={handleDelete}>
                                    Delete
                                </button>
                            </div>
                        )}

                        <div className="apartment-details-price">
                            €{apartment.price}
                            <span> / month</span>
                        </div>

                        <h1>{apartment.neighborhood}</h1>

                        <p className="apartment-details-location">
                            {apartment.city}
                        </p>

                        <div className="apartment-details-info">
                            <div>
                                <strong>Floor</strong>
                                <span>{apartment.floor}</span>
                            </div>

                            <div>
                                <strong>Rooms</strong>
                                <span>{apartment.rooms}</span>
                            </div>

                            <div>
                                <strong>Storage</strong>
                                <span>
                                    {apartment.storage ? "Yes" : "No"}
                                </span>
                            </div>

                            <div>
                                <strong>Air Conditioning</strong>
                                <span>
                                    {apartment.ac ? "Yes" : "No"}
                                </span>
                            </div>

                            <div>
                                <strong>Garage</strong>
                                <span>
                                    {apartment.garage ? "Yes" : "No"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
