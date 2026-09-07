import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "./CreateListing.css";

export default function CreateListing() {
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | "">("");

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
    const [pictures, setPictures] = useState<File[]>([]);

    useEffect(() => {
        async function loadNeighborhoods() {
            const { data, error } = await supabase
                .from("Neighborhoods")
                .select("id, name")
                .order("name");

            if (error) {
                console.error("Error loading neighborhoods:", error);
                return;
            }

            setNeighborhoods(data);
        }

        loadNeighborhoods();
    }, []);

    function handlePictureChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const files = Array.from(event.target.files ?? []);
        setPictures(files);
    }

    async function handleSubmit(event: React.SubmitEvent) {
        event.preventDefault();

        setMessage("");
        setMessageType("");

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setMessage("You must be logged in to create a listing.");
            setMessageType("error");
            return;
        }

        const { data, error } = await supabase
            .from("Apartments")
            .insert({
                creator_id: user.id,
                city,
                neighborhood_id: neighborhoodId,
                price: Number(price),
                floor: Number(floor),
                rooms: Number(rooms),
                storage,
                ac,
                garage,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating listing:", error);
            setMessage("Failed to create listing. Please try again.");
            setMessageType("error");
            return;
        }

        for (const picture of pictures) {
            const filePath = `${user.id}/${data.id}/${crypto.randomUUID()}-${picture.name}`;

            const { error: uploadError } = await supabase.storage
                .from("apartment-images")
                .upload(filePath, picture, {
                    contentType: picture.type,
                    upsert: false,
                });

            if (uploadError) {
                console.error("Error uploading image:", uploadError);
                setMessage("Listing created, but an image failed to upload.");
                setMessageType("error");
                return;
            }

            const { error: imageRecordError } = await supabase
                .from("ApartmentImages")
                .insert({
                    apartment_id: data.id,
                    image_path: filePath,
                });

            if (imageRecordError) {
                console.error("Error saving image record:", imageRecordError);
                setMessage("Listing created, but an image record failed to save.");
                setMessageType("error");
                return;
            }
        }

        setMessage("Listing created successfully!");
        setMessageType("success");
    }

    return (
        <main className="create-listing">
            <div className="listing-card">
                <h1>Create Listing</h1>

                <p className="listing-description">
                    Add the details of your apartment.
                </p>

                <form onSubmit={handleSubmit}>
                    <section className="form-section">
                        <h2>Location</h2>

                        <div className="form-row">
                            <div className="form-field">
                                <label htmlFor="city">City</label>
                                <input
                                    id="city"
                                    type="text"
                                    placeholder="e.g. Sofia"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="neighborhood">Neighborhood</label>
                                <select
                                    id="neighborhood"
                                    value={neighborhoodId}
                                    onChange={(e) => setNeighborhoodId(e.target.value)}
                                    required
                                >
                                    <option value="">Select a neighborhood</option>

                                    {neighborhoods.map((neighborhood) => (
                                        <option key={neighborhood.id} value={neighborhood.id}>
                                            {neighborhood.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="form-section">
                        <h2>Details</h2>

                        <div className="form-row">
                            <div className="form-field">
                                <label htmlFor="price">Price</label>
                                <input
                                    id="price"
                                    type="number"
                                    placeholder="e.g. 1200"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="floor">Floor</label>
                                <input
                                    id="floor"
                                    type="number"
                                    placeholder="e.g. 4"
                                    value={floor}
                                    onChange={(e) => setFloor(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="rooms">Rooms</label>
                                <input
                                    id="rooms"
                                    type="number"
                                    placeholder="e.g. 2"
                                    value={rooms}
                                    onChange={(e) => setRooms(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-checkboxes">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={storage}
                                    onChange={(e) => setStorage(e.target.checked)}
                                />
                                Storage
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={ac}
                                    onChange={(e) => setAc(e.target.checked)}
                                />
                                Air Conditioning
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={garage}
                                    onChange={(e) => setGarage(e.target.checked)}
                                />
                                Garage
                            </label>
                        </div>
                    </section>

                    <section className="form-section">
                        <h2>Pictures</h2>

                        <div className="form-field">
                            <label htmlFor="picture">Apartment Pictures</label>
                            <input
                                id="picture"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePictureChange}
                            />
                        </div>
                    </section>

                    {message && (
                        <p className={`form-message ${messageType}`}>
                            {message}
                        </p>
                    )}

                    <button type="submit">Create Listing</button>
                </form>
            </div>
        </main>
    );
}
