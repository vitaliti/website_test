import "./Home.css";
import { useEffect, useState } from "react";
import * as db from "../services/DatabaseService";
import ApartmentCard from "../sub_components/ApartmentCard";
import { prepareApartments } from "../sub_components/prepareApartments";
import type { Apartment } from "../../types/Apartment";
import ApartmentMap from "../sub_components/ApartmentMap";

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

    const [apartments, setApartments] = useState<Apartment[]>([]);
    const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);

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
        const { data, error } = await db.searchApartments(
            city,
            neighborhoodId,
            price,
            floor,
            rooms,
            storage,
            ac,
            garage
        );

        if (error) {
            console.error("Error searching apartments:", error);
            return;
        }

        const apartmentsWithData = await prepareApartments(data ?? []);

        setApartments(apartmentsWithData ?? []);
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
                        <div className="apartment-list">
                            {apartments.map((apartment) => (
                                <ApartmentCard
                                    key={apartment.id}
                                    apartment={apartment}
                                    selected={selectedApartmentId === apartment.id}
                                />
                            ))}
                        </div>

                        <ApartmentMap
                            apartments={apartments}
                            selectedApartmentId={selectedApartmentId}
                            onApartmentSelect={setSelectedApartmentId}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}