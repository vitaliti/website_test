import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "./ApartmentDetails.css";

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

export default function ApartmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadApartment() {
      if (!id) {
        setError("Apartment not found.");
        setLoading(false);
        return;
      }

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

      setApartment(data);
      setLoading(false);
    }

    loadApartment();
  }, [id]);

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
            {apartment.picture ? (
              <img
                src={apartment.picture}
                alt={`${apartment.city}, ${apartment.neighborhood}`}
              />
            ) : (
              <span>No image available</span>
            )}
          </div>

          <div className="apartment-details-content">

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
                <span>{apartment.storage ? "Yes" : "No"}</span>
              </div>

              <div>
                <strong>Air Conditioning</strong>
                <span>{apartment.ac ? "Yes" : "No"}</span>
              </div>

              <div>
                <strong>Garage</strong>
                <span>{apartment.garage ? "Yes" : "No"}</span>
              </div>

            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
