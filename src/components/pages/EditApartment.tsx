import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "./CreateListing.css";

export default function EditApartment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [price, setPrice] = useState("");
  const [floor, setFloor] = useState("");
  const [rooms, setRooms] = useState("");
  const [storage, setStorage] = useState(false);
  const [ac, setAc] = useState(false);
  const [garage, setGarage] = useState(false);

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

      setCity(data.city);
      setNeighborhood(data.neighborhood);
      setPrice(String(data.price));
      setFloor(String(data.floor));
      setRooms(String(data.rooms));
      setStorage(data.storage);
      setAc(data.ac);
      setGarage(data.garage);

      setLoading(false);
    }

    loadApartment();
  }, [id]);

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
        neighborhood,
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

    navigate(`/apartments/${id}`);
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
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
                <label>City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Neighborhood</label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(event) =>
                    setNeighborhood(event.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Apartment Details</h2>

            <div className="form-row">
              <div className="form-field">
                <label>Price (€ / month)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Floor</label>
                <input
                  type="number"
                  value={floor}
                  onChange={(event) => setFloor(event.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Rooms</label>
                <input
                  type="number"
                  value={rooms}
                  onChange={(event) => setRooms(event.target.value)}
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
