import { useState } from "react";

import "./CreateListing.css";

export default function CreateListing() {
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [price, setPrice] = useState("");
  const [floor, setFloor] = useState("");
  const [rooms, setRooms] = useState("");
  const [storage, setStorage] = useState(false);
  const [ac, setAc] = useState(false);
  const [garage, setGarage] = useState(false);
  const [picture, setPicture] = useState<File | null>(null);

  function handlePictureChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null;
    setPicture(file);
  }

function handleSubmit(event: React.SubmitEvent) {
  event.preventDefault();

  console.log({
    city,
    neighborhood,
    price,
    floor,
    rooms,
    storage,
    ac,
    garage,
    picture,
  });
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
                <input
                  id="neighborhood"
                  type="text"
                  placeholder="e.g. Lozenets"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  required
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>Apartment Details</h2>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="price">Price (€ / month)</label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  placeholder="e.g. 700"
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
                  min="0"
                  max="50"
                  placeholder="e.g. 4"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="rooms">Number of rooms</label>
                <input
                  id="rooms"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="e.g. 3"
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                  required
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>Features</h2>

            <div className="checkbox-grid">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={storage}
                  onChange={(e) => setStorage(e.target.checked)}
                />
                <span>Storage</span>
              </label>

              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={ac}
                  onChange={(e) => setAc(e.target.checked)}
                />
                <span>Air conditioning</span>
              </label>

              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={garage}
                  onChange={(e) => setGarage(e.target.checked)}
                />
                <span>Garage</span>
              </label>
            </div>
          </section>

          <section className="form-section">
            <h2>Picture</h2>

            <div className="picture-upload">
              <label htmlFor="picture" className="upload-button">
                Choose picture
              </label>

              <input
                id="picture"
                type="file"
                accept="image/*"
                onChange={handlePictureChange}
              />

              {picture && (
                <p className="selected-picture">
                  Selected: {picture.name}
                </p>
              )}
            </div>
          </section>

          <button type="submit" className="create-listing-button">
            Create Listing
          </button>
        </form>
      </div>
    </main>
  );
}