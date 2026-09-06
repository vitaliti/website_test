import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "./ApartmentDetails.css";

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
    } = await supabase.auth.getUser();

    setCurrentUserId(user?.id ?? null);

      const { data: apartmentData, error: apartmentError } =
        await supabase
          .from("Apartments")
          .select("*")
          .eq("id", id)
          .single();

      if (apartmentError) {
        console.error("Error loading apartment:", apartmentError);
        setError("Failed to load apartment.");
        setLoading(false);
        return;
      }

      const { data: imagesData, error: imagesError } = await supabase
        .from("ApartmentImages")
        .select("id, apartment_id, image_path")
        .eq("apartment_id", id);

      if (imagesError) {
        console.error("Error loading apartment images:", imagesError);
        setError("Failed to load apartment images.");
        setLoading(false);
        return;
      }

      setApartment({
        ...apartmentData,
        images: imagesData ?? [],
      });

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

  const selectedImageData = apartment.images[selectedImage];

  const selectedImageUrl = selectedImageData
    ? supabase.storage
        .from("apartment-images")
        .getPublicUrl(selectedImageData.image_path).data.publicUrl
    : null;

  async function handleDelete() {
    if (!id) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this apartment?"
    );

    if (!confirmed) {
      return;
    }

    const { data: images, error: imagesError } = await supabase
      .from("ApartmentImages")
      .select("image_path")
      .eq("apartment_id", id);

    if (imagesError) {
      console.error("Error loading apartment images:", imagesError);
      return;
    }

    if (images && images.length > 0) {
      const imagePaths = images.map((image) => image.image_path);

      const { error: storageError } = await supabase.storage
        .from("apartment-images")
        .remove(imagePaths);

      if (storageError) {
        console.error("Error deleting apartment images:", storageError);
        return;
      }
    }

    const { error } = await supabase
      .from("Apartments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting apartment:", error);
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
                const imageUrl = supabase.storage
                  .from("apartment-images")
                  .getPublicUrl(image.image_path).data.publicUrl;

                return (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
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

            {currentUserId === apartment.creator_id && (
              <div className="apartment-owner-actions">
                <button onClick={() => navigate(`/apartments/${apartment.id}/edit`)}>
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
