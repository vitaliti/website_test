import { useEffect, useState } from "react";
import * as db from "../services/DatabaseService";
import ApartmentCard from "../../components/sub_components/ApartmentCard";
import type { Apartment } from "../../types/Apartment";
import { prepareApartments } from "../sub_components/prepareApartments";
import "./MyApartments.css";

type FavoriteApartment = {
    id: string;
    city: string;
    neighborhood_id: string;
    price: number;
    floor: number;
    rooms: number;
    storage: boolean;
    ac: boolean;
    garage: boolean;
    latitude: number;
    longitude: number;
};

export default function MyApartments() {
    const [apartments, setApartments] = useState<Apartment[]>([]);
    const [favorites, setFavorites] = useState<Apartment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadApartments() {
            setLoading(true);
            setError("");

            const { data: { user } } = await db.getUser();
            if (!user) {
                setError("You must be logged in to view your apartments.");
                setLoading(false);
                return;
            }

            const { data: apartmentsData, error: apartmentsError } = await db.getUserApartments(user.id);
            if (apartmentsError) {
                console.error("Error loading apartments:", apartmentsError);
                setError("Failed to load your apartments.");
                setLoading(false);
                return;
            }

            const { data: favoritesData, error: favoritesError } = await db.getUserFavorites(user.id);
            console.log("Favorites data:", favoritesData);
            if (favoritesError) {
                console.error("Error loading favorites:", favoritesError);
                setError("Failed to load your favorites.");
                setLoading(false);
                return;
            }

            const apartments = apartmentsData ?? [];
            const apartmentsWithData = await prepareApartments(apartments);
            if (!apartmentsWithData) {
                setError("Failed to load apartment images.");
                setLoading(false);
                return;
            }

            setApartments(apartmentsWithData);

            const favoriteApartments = (favoritesData ?? [])
                .map(
                    (favorite) =>
                        favorite.Apartments as unknown as FavoriteApartment
                );

            const favoritesWithData = await prepareApartments(favoriteApartments);
            setFavorites(favoritesWithData ?? []);
            setLoading(false);
        }

        loadApartments();
    }, []);

    if (loading) {
        return <p className="apartments-status">Loading apartments...</p>;
    }

    if (error) {
        return <p className="apartments-status error">{error}</p>;
    }

    return (
        <main className="my-apartments">
            <div className="apartments-container">
                <h1>My Apartments</h1>

                {apartments.length === 0 ? (
                    <p className="apartments-status">
                        You haven't created any apartment listings yet.
                    </p>
                ) : (
                    <div className="apartments-grid">
                        {apartments.map((apartment) => (
                            <ApartmentCard
                                key={apartment.id}
                                apartment={apartment}
                            />
                        ))}
                    </div>
                )}

                <h1>Favorites</h1>

                {favorites.length === 0 ? (
                    <p className="apartments-status">
                        You haven't added any favorites yet.
                    </p>
                ) : (
                    <div className="apartments-grid">
                        {favorites.map((apartment) => (
                            <ApartmentCard
                                key={apartment.id}
                                apartment={apartment}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
