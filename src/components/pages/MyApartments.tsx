import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "./MyApartments.css";

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
  picture: string | null;
};

export default function MyApartments() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadApartments() {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to view your apartments.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("Apartments")
        .select("*")
        .eq("creator_id", user.id);

      if (error) {
        console.error("Error loading apartments:", error);
        setError("Failed to load your apartments.");
        setLoading(false);
        return;
      }

      setApartments(data ?? []);
      setLoading(false);
    }

    loadApartments();
  }, []);

  if (loading) {
    return (
      <main className="my-apartments">
        <h1>My Apartments</h1>
        <p className="apartments-status">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="my-apartments">
        <h1>My Apartments</h1>
        <p className="apartments-status error">{error}</p>
      </main>
    );
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
              <article className="apartment-card" key={apartment.id}>
                <div className="apartment-image">
                  {apartment.picture ? (
                    <img
                      src={apartment.picture}
                      alt={`${apartment.city}, ${apartment.neighborhood}`}
                    />
                  ) : (
                    <span>No image</span>
                  )}
                </div>

                <div className="apartment-info">
                  <div className="apartment-price">
                    €{apartment.price} <span>/ month</span>
                  </div>

                  <h2>{apartment.neighborhood}</h2>

                  <p className="apartment-location">
                    {apartment.city}
                  </p>

                  <div className="apartment-details">
                    <span>Floor {apartment.floor}</span>
                    <span>{apartment.rooms} rooms</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
