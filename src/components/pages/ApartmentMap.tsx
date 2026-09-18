import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./ApartmentMap.css";
import type { Apartment } from "../../types/Apartment";

type ApartmentMapProps = {
    apartments: Apartment[];
    selectedApartmentId: string | null;
    onApartmentSelect: (id: string) => void;
};

function MapController({
    apartments,
    selectedApartmentId,
}: {
    apartments: Apartment[];
    selectedApartmentId: string | null;
}) {
    const map = useMap();

    if (selectedApartmentId) {
        const apartment = apartments.find(
            (apartment) => apartment.id === selectedApartmentId
        );

        if (apartment) {
            map.setView([apartment.latitude, apartment.longitude], 15);
        }
    }

    return null;
}

const apartmentIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export default function ApartmentMap({
    apartments,
    selectedApartmentId,
    onApartmentSelect,
}: ApartmentMapProps) {
    const sofiaCenter: [number, number] = [42.6977, 23.3219];

    return (
        <div className="apartment-map">
            <MapContainer
                center={sofiaCenter}
                zoom={12}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController
                    apartments={apartments}
                    selectedApartmentId={selectedApartmentId}
                />

                {apartments.map((apartment) => (
                    <Marker
                        key={apartment.id}
                        position={[apartment.latitude, apartment.longitude]}
                        icon={apartmentIcon}
                        eventHandlers={{
                            click: () => onApartmentSelect(apartment.id),
                        }}
                    >
                        <Popup>
                            <strong>{apartment.price} €</strong>
                            <br />
                            {apartment.rooms} rooms
                            <br />
                            Floor {apartment.floor}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
