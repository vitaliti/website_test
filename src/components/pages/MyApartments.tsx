import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "./MyApartments.css";

type ApartmentImage = {
  id: string;
  apartment_id: string;
  image_path: string;
};

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
  images: ApartmentImage[];
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

      const { data: apartmentsData, error: apartmentsError } =
        await supabase
          .from("Apartments")
          .select("*")
          .eq("creator_id", user.id);

      if (apartmentsError) {
        console.error("Error loading apartments:", apartmentsError);
        setError("Failed to load your apartments.");
        setLoading(false);
        return;
      }

      const apartments = apartmentsData ?? [];

      const apartmentIds = apartments.map(
        (apartment) => apartment.id
      );

      let imagesData: ApartmentImage[] = [];

      if (apartmentIds.length > 0) {
        const { data, error: imagesError } = await supabase
          .from("ApartmentImages")
          .select("id, apartment_id, image_path")
          .in("apartment_id", apartmentIds);

        if (imagesError) {
          console.error("Error loading images:", imagesError);
          setError("Failed to load apartment images.");
          setLoading(false);
          return;
        }

        imagesData = data ?? [];
      }

      const apartmentsWithImages: Apartment[] = apartments.map(
        (apartment) => ({
          ...apartment,
          images: imagesData.filter(
            (image) => image.apartment_id === apartment.id
          ),
        })
      );

      setApartments(apartmentsWithImages);
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

  if (apartments.length === 0) {
    return (
      <p className="apartments-status">
        You haven't created any apartment listings yet.
      </p>
    );
  }

  return (
    <main className="my-apartments">
      <div className="apartments-container">
        <h1>My Apartments</h1>

        <div className="apartments-grid">
          {apartments.map((apartment) => {
            const firstImage = apartment.images[0];

            return (
              <Link
                key={apartment.id}
                to={`/apartments/${apartment.id}`}
                className="apartment-card"
              >
                <div className="apartment-image">
                  {firstImage ? (
                    <img
                      src={
                        supabase.storage
                          .from("apartment-images")
                          .getPublicUrl(firstImage.image_path)
                          .data.publicUrl
                      }
                      alt={`${apartment.city} apartment`}
                    />
                  ) : (
                    "No image"
                  )}
                </div>

                <div className="apartment-info">
                  <div className="apartment-price">
                    {apartment.price} €
                    <span> / month</span>
                  </div>

                  <h2>{apartment.rooms} rooms</h2>

                  <p className="apartment-location">
                    {apartment.neighborhood}, {apartment.city}
                  </p>

                  <div className="apartment-details">
                    <span>Floor {apartment.floor}</span>

                    {apartment.storage && <span>Storage</span>}
                    {apartment.ac && <span>AC</span>}
                    {apartment.garage && <span>Garage</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
