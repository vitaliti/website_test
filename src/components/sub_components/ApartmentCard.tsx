import { Link } from "react-router-dom";
import * as db from "../services/DatabaseService";
import type { Apartment } from "../../types/Apartment";

import "./ApartmentCard.css";

type ApartmentCardProps = {
    apartment: Apartment;
    selected?: boolean;
};

export default function ApartmentCard({
    apartment,
    selected
}: ApartmentCardProps) {
    const firstImage = apartment.images[0];

    return (
        <Link
            to={`/apartments/${apartment.id}`}
            className={`apartment-card ${selected ? "selected" : ""}`}
        >
            <div className="apartment-image">
                {firstImage ? (
                    <img
                        src={db.getApartmentImageUrl(firstImage.image_path)}
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
                    {apartment.neighborhood},{" "}
                    {apartment.city}
                </p>

                <div className="apartment-details">
                    <span>Floor {apartment.floor}</span>

                    {apartment.storage && (
                        <span>Storage</span>
                    )}

                    {apartment.ac && <span>AC</span>}

                    {apartment.garage && (
                        <span>Garage</span>
                    )}
                </div>
            </div>
        </Link>
    );
}