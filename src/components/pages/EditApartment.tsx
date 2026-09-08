import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "./CreateListing.css";

type ApartmentImage = {
    id: string;
    apartment_id: string;
    image_path: string;
    display_order: number;
};

export default function EditApartment() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [city, setCity] = useState("");
    const [neighborhoodId, setNeighborhoodId] = useState("");
    const [neighborhoods, setNeighborhoods] = useState<
        { id: string; name: string }[]
    >([]);

    const [price, setPrice] = useState("");
    const [floor, setFloor] = useState("");
    const [rooms, setRooms] = useState("");
    const [storage, setStorage] = useState(false);
    const [ac, setAc] = useState(false);
    const [garage, setGarage] = useState(false);

    const [images, setImages] = useState<ApartmentImage[]>([]);
    const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
    const [newPictures, setNewPictures] = useState<File[]>([]);

    const [draggedImageId, setDraggedImageId] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadApartment() {
            if (!id) {
                setError("Apartment not found.");
                setLoading(false);
                return;
            }

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                setError("You must be logged in.");
                setLoading(false);
                return;
            }

            const { data: neighborhoodData, error: neighborhoodError } =
                await supabase
                    .from("Neighborhoods")
                    .select("id, name")
                    .order("name");

            if (neighborhoodError) {
                console.error(
                    "Error loading neighborhoods:",
                    neighborhoodError
                );
                setError("Failed to load neighborhoods.");
                setLoading(false);
                return;
            }

            setNeighborhoods(neighborhoodData);

            const { data, error } = await supabase
                .from("Apartments")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                console.error("Error loading apartment:", error);
                setError("Failed to load apartment.");
                setLoading(false);
                return;
            }

            if (data.creator_id !== user.id) {
                setError("You are not allowed to edit this apartment.");
                setLoading(false);
                return;
            }

            const { data: imageData, error: imageError } = await supabase
                .from("ApartmentImages")
                .select("id, apartment_id, image_path, display_order")
                .eq("apartment_id", id)
                .order("display_order", { ascending: true });

            if (imageError) {
                console.error("Error loading apartment images:", imageError);
                setError("Failed to load apartment images.");
                setLoading(false);
                return;
            }

            setCity(data.city);
            setNeighborhoodId(data.neighborhood_id);
            setPrice(String(data.price));
            setFloor(String(data.floor));
            setRooms(String(data.rooms));
            setStorage(data.storage);
            setAc(data.ac);
            setGarage(data.garage);
            setImages(imageData ?? []);

            setLoading(false);
        }

        loadApartment();
    }, [id]);

    function handleImageSelect(imageId: string) {
        setSelectedImageIds((currentSelectedIds) => {
            if (currentSelectedIds.includes(imageId)) {
                return currentSelectedIds.filter((id) => id !== imageId);
            }

            return [...currentSelectedIds, imageId];
        });
    }

    function handlePictureChange(event: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(event.target.files ?? []);
        setNewPictures(files);
    }

    function handleDragStart(imageId: string) {
        setDraggedImageId(imageId);
    }

    function handleDragEnd() {
        setDraggedImageId(null);
    }

    function handleDrop(targetImageId: string) {
        if (!draggedImageId || draggedImageId === targetImageId) {
            setDraggedImageId(null);
            return;
        }

        setImages((currentImages) => {
            const draggedIndex = currentImages.findIndex(
                (image) => image.id === draggedImageId
            );

            const targetIndex = currentImages.findIndex(
                (image) => image.id === targetImageId
            );

            if (draggedIndex === -1 || targetIndex === -1) {
                return currentImages;
            }

            const newImages = [...currentImages];
            const [draggedImage] = newImages.splice(draggedIndex, 1);
            newImages.splice(targetIndex, 0, draggedImage);

            return newImages;
        });

        setDraggedImageId(null);
    }

    async function handleDeleteSelectedImages() {
        if (!id || selectedImageIds.length === 0) {
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete ${selectedImageIds.length} selected image${selectedImageIds.length === 1 ? "" : "s"}?`
        );

        if (!confirmed) {
            return;
        }

        setSaving(true);
        setError("");

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setError("You must be logged in.");
            setSaving(false);
            return;
        }

        const imagesToDelete = images.filter((image) =>
            selectedImageIds.includes(image.id)
        );

        const imagePaths = imagesToDelete.map((image) => image.image_path);

        if (imagePaths.length > 0) {
            const { error: storageError } = await supabase.storage
                .from("apartment-images")
                .remove(imagePaths);

            if (storageError) {
                console.error(
                    "Error deleting apartment images from storage:",
                    storageError
                );
                setError("Failed to delete images.");
                setSaving(false);
                return;
            }
        }

        const { error: databaseError } = await supabase
            .from("ApartmentImages")
            .delete()
            .in("id", selectedImageIds)
            .eq("apartment_id", id);

        if (databaseError) {
            console.error(
                "Error deleting apartment image records:",
                databaseError
            );
            setError(
                "Images were removed from storage, but their records could not be deleted."
            );
            setSaving(false);
            return;
        }

        setImages((currentImages) =>
            currentImages.filter(
                (image) => !selectedImageIds.includes(image.id)
            )
        );

        setSelectedImageIds([]);
        setSaving(false);
    }

    async function handleSubmit(event: React.SubmitEvent) {
        event.preventDefault();

        if (!id) {
            return;
        }

        setSaving(true);
        setError("");

        const { error } = await supabase
            .from("Apartments")
            .update({
                city,
                neighborhood_id: neighborhoodId,
                price: Number(price),
                floor: Number(floor),
                rooms: Number(rooms),
                storage,
                ac,
                garage,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
            console.error("Error updating apartment:", error);
            setError(error.message);
            setSaving(false);
            return;
        }

        for (let index = 0; index < images.length; index++) {
            const image = images[index];

            const { error: imageOrderError } = await supabase
                .from("ApartmentImages")
                .update({
                    display_order: index,
                })
                .eq("id", image.id)
                .eq("apartment_id", id);

            if (imageOrderError) {
                console.error(
                    "Error updating apartment image order:",
                    imageOrderError
                );
                setError(imageOrderError.message);
                setSaving(false);
                return;
            }
        }

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setError("You must be logged in.");
            setSaving(false);
            return;
        }

        try {
            await Promise.all(
                newPictures.map(async (picture, index) => {
                    const displayOrder = images.length + index;

                    const filePath = `${user.id}/${id}/${crypto.randomUUID()}-${picture.name}`;

                    const { error: uploadError } = await supabase.storage
                        .from("apartment-images")
                        .upload(filePath, picture, {
                            contentType: picture.type,
                            upsert: false,
                        });

                    if (uploadError) {
                        throw new Error(
                            "Apartment was updated, but an image failed to upload."
                        );
                    }

                    const { error: imageRecordError } = await supabase
                        .from("ApartmentImages")
                        .insert({
                            apartment_id: id,
                            image_path: filePath,
                            display_order: displayOrder,
                        });

                    if (imageRecordError) {
                        throw new Error(
                            "Image was uploaded, but its record failed to save."
                        );
                    }
                })
            );
        } catch (error) {
            console.error("Error adding apartment images:", error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to add apartment images."
            );

            setSaving(false);
            return;
        }

        navigate(`/apartments/${id}`);
    }

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error && !images.length) {
        return <p>{error}</p>;
    }

    return (
        <main className="create-listing">
            <div className="listing-card">
                <h1>Edit Apartment</h1>

                <p className="listing-description">
                    Update your apartment listing.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h2>Location</h2>

                        <div className="form-row">
                            <div className="form-field">
                                <label htmlFor="city">City</label>

                                <input
                                    id="city"
                                    type="text"
                                    value={city}
                                    onChange={(event) =>
                                        setCity(event.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="neighborhood">
                                    Neighborhood
                                </label>

                                <select
                                    id="neighborhood"
                                    value={neighborhoodId}
                                    onChange={(event) =>
                                        setNeighborhoodId(event.target.value)
                                    }
                                    required
                                >
                                    <option value="">
                                        Select a neighborhood
                                    </option>

                                    {neighborhoods.map((neighborhood) => (
                                        <option
                                            key={neighborhood.id}
                                            value={neighborhood.id}
                                        >
                                            {neighborhood.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Apartment Details</h2>

                        <div className="form-row">
                            <div className="form-field">
                                <label htmlFor="price">
                                    Price (€ / month)
                                </label>

                                <input
                                    id="price"
                                    type="number"
                                    value={price}
                                    onChange={(event) =>
                                        setPrice(event.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="floor">Floor</label>

                                <input
                                    id="floor"
                                    type="number"
                                    value={floor}
                                    onChange={(event) =>
                                        setFloor(event.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="rooms">Rooms</label>

                                <input
                                    id="rooms"
                                    type="number"
                                    value={rooms}
                                    onChange={(event) =>
                                        setRooms(event.target.value)
                                    }
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Features</h2>

                        <div className="checkbox-grid">
                            <label className="checkbox-option">
                                <input
                                    type="checkbox"
                                    checked={storage}
                                    onChange={(event) =>
                                        setStorage(event.target.checked)
                                    }
                                />

                                <span>Storage</span>
                            </label>

                            <label className="checkbox-option">
                                <input
                                    type="checkbox"
                                    checked={ac}
                                    onChange={(event) =>
                                        setAc(event.target.checked)
                                    }
                                />

                                <span>Air Conditioning</span>
                            </label>

                            <label className="checkbox-option">
                                <input
                                    type="checkbox"
                                    checked={garage}
                                    onChange={(event) =>
                                        setGarage(event.target.checked)
                                    }
                                />

                                <span>Garage</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Pictures</h2>

                        {images.length > 0 && (
                            <>
                                <div className="apartment-edit-images">
                                    {images.map((image, index) => {
                                        const imageUrl = supabase.storage
                                            .from("apartment-images")
                                            .getPublicUrl(image.image_path)
                                            .data.publicUrl;

                                        const isSelected =
                                            selectedImageIds.includes(
                                                image.id
                                            );

                                        const isDragging =
                                            draggedImageId === image.id;

                                        return (
                                            <div
                                                key={image.id}
                                                draggable
                                                onDragStart={() =>
                                                    handleDragStart(image.id)
                                                }
                                                onDragEnd={handleDragEnd}
                                                onDragOver={(event) =>
                                                    event.preventDefault()
                                                }
                                                onDrop={() =>
                                                    handleDrop(image.id)
                                                }
                                                onClick={() =>
                                                    handleImageSelect(image.id)
                                                }
                                                className={`apartment-edit-image${isDragging ? " dragging" : ""}${isSelected ? " selected" : ""}`}
                                            >
                                                <img
                                                    src={imageUrl}
                                                    alt={`Apartment ${index + 1}`}
                                                />

                                                <div className="apartment-edit-image-order">
                                                    Picture {index + 1}
                                                    {index === 0 && " (Main)"}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="image-actions">
                                    <button
                                        type="button"
                                        className="delete-images-button"
                                        onClick={handleDeleteSelectedImages}
                                        disabled={
                                            selectedImageIds.length === 0 ||
                                            saving
                                        }
                                    >
                                        Delete Selected
                                        {selectedImageIds.length > 0 &&
                                            ` (${selectedImageIds.length})`}
                                    </button>
                                </div>
                            </>
                        )}

                        <div className="form-field">
                            <div className="picture-upload">
                                <input
                                    id="new-pictures"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePictureChange}
                                />

                                <label
                                    htmlFor="new-pictures"
                                    className="picture-upload-button"
                                >
                                    Choose pictures
                                </label>

                                <span className="picture-upload-count">
                                    {newPictures.length === 0
                                        ? "No pictures selected"
                                        : newPictures.length === 1
                                          ? "1 picture selected"
                                          : `${newPictures.length} pictures selected`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p className="listing-message error">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="create-listing-button"
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                        type="button"
                        className="cancel-button"
                        onClick={() => navigate(`/apartments/${id}`)}
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </main>
    );
}

