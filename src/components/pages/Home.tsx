import "./Home.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as db from "../services/DatabaseService";

export default function Home() {
    const [city, setCity] = useState("");
    const [neighborhoodId, setNeighborhoodId] = useState("");
    const [price, setPrice] = useState("");
    const [floor, setFloor] = useState("");
    const [rooms, setRooms] = useState("");
    const [ac, setAc] = useState(false);
    const [storage, setStorage] = useState(false);
    const [garage, setGarage] = useState(false);

    const [neighborhoods, setNeighborhoods] = useState<
        { id: string; name: string }[]
    >([]);

    const [apartments, setApartments] = useState<any[]>([]);

    useEffect(() => {
        async function loadNeighborhoods() {
            const { data, error } = await db.getNeighborhoods();
            if (error) {
                console.error("Error loading neighborhoods:", error);
                return;
            }

            setNeighborhoods(data ?? []);
        }

        loadNeighborhoods();
    }, []);

    async function handleSearch() {
        const { data, error } = await db.searchApartments(city, neighborhoodId, price, floor, rooms, storage, ac, garage);
        if (error) {
            console.error("Error searching apartments:", error);
            return;
        }

        const apartmentsWithImages = await Promise.all(
            (data ?? []).map(async (apartment) => {
                const { data: imageData, error: imageError } = await db.getFirstApartmentImage(apartment.id);
                if (imageError) {
                    console.error(
                        "Error loading apartment image:",
                        imageError
                    );
                }

                let imageUrl = null;

                if (imageData) {
                    imageUrl = db.getApartmentImageUrl(imageData.image_path);
                }

                return {
                    ...apartment,
                    imageUrl,
                };
            })
        );

        setApartments(apartmentsWithImages);
    }

    return (
        <div className="home">
            <h1>Find your apartment in Sofia.</h1>
            <p>Search rentals across the city — no account needed.</p>

            <div className="filters">
                <div className="filter">
                    <label htmlFor="city">City</label>
                    <input
                        id="city"
                        type="text"
                        placeholder="e.g. Sofia"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                    />
                </div>

                <div className="filter">
                    <label htmlFor="neighborhood">Neighborhood</label>
                    <select
                        id="neighborhood"
                        value={neighborhoodId}
                        onChange={(e) => setNeighborhoodId(e.target.value)}
                    >
                        <option value="">Any</option>

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

                <div className="filter">
                    <label htmlFor="price">Price</label>
                    <input
                        id="price"
                        type="number"
                        placeholder="e.g. 600"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </div>

                <div className="filter">
                    <label htmlFor="floor">Floor</label>
                    <input
                        id="floor"
                        type="number"
                        placeholder="e.g. 3"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                    />
                </div>

                <div className="filter">
                    <label htmlFor="rooms">Rooms</label>
                    <input
                        id="rooms"
                        type="number"
                        placeholder="e.g. 2"
                        value={rooms}
                        onChange={(e) => setRooms(e.target.value)}
                    />
                </div>

                <div className="filter-checkboxes">
                    <label>
                        <input
                            type="checkbox"
                            checked={ac}
                            onChange={(e) => setAc(e.target.checked)}
                        />
                        AC
                    </label>

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
                            checked={garage}
                            onChange={(e) => setGarage(e.target.checked)}
                        />
                        Garage
                    </label>
                </div>

                <button
                    className="search-button"
                    type="button"
                    onClick={handleSearch}
                >
                    Search
                </button>
            </div>

            {apartments.length > 0 && (
                <div className="search-results">
                    <h2>Available apartments</h2>

                    <div className="apartment-results">
                        {apartments.map((apartment) => (
                            <Link
                                to={`/apartments/${apartment.id}`}
                                className="apartment-card"
                                key={apartment.id}
                            >
                                {apartment.imageUrl ? (
                                    <img
                                        className="apartment-image"
                                        src={apartment.imageUrl}
                                        alt="Apartment"
                                    />
                                ) : (
                                    <div className="apartment-image apartment-image-placeholder">
                                        No image
                                    </div>
                                )}

                                <div className="apartment-info">
                                    <h3>{apartment.price} €</h3>

                                    <p className="apartment-location">
                                        {apartment.Neighborhoods?.name},{" "}
                                        {apartment.city}
                                    </p>

                                    <p className="apartment-details">
                                        {apartment.rooms} rooms · Floor{" "}
                                        {apartment.floor}
                                    </p>

                                    <div className="apartment-features">
                                        {apartment.ac && <span>AC</span>}
                                        {apartment.storage && (
                                            <span>Storage</span>
                                        )}
                                        {apartment.garage && (
                                            <span>Garage</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
