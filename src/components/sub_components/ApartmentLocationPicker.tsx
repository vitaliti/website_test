import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./ApartmentLocationPicker.css";

type ApartmentLocationPickerProps = {
    latitude: number | null;
    longitude: number | null;
    onLocationChange: (latitude: number, longitude: number) => void;
};

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

function MapClickHandler({
    onLocationChange,
}: {
    onLocationChange: (latitude: number, longitude: number) => void;
}) {
    useMapEvents({
        click(event) {
            onLocationChange(event.latlng.lat, event.latlng.lng);
        },
    });

    return null;
}

function MapCenter({
    latitude,
    longitude,
}: {
    latitude: number | null;
    longitude: number | null;
}) {
    const map = useMapEvents({});

    useEffect(() => {
        if (latitude !== null && longitude !== null) {
            map.setView([latitude, longitude]);
        }
    }, [latitude, longitude, map]);

    return null;
}

export default function ApartmentLocationPicker({
    latitude,
    longitude,
    onLocationChange,
}: ApartmentLocationPickerProps) {
    const defaultCenter: [number, number] = [42.6977, 23.3219];

    const center: [number, number] =
        latitude !== null && longitude !== null
            ? [latitude, longitude]
            : defaultCenter;

    return (
        <div className="apartment-location-picker">
            <p>Click on the map to select the approximate apartment location.</p>

            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapClickHandler
                    onLocationChange={onLocationChange}
                />

                <MapCenter
                    latitude={latitude}
                    longitude={longitude}
                />

                {latitude !== null && longitude !== null && (
                    <Marker
                        position={[latitude, longitude]}
                        icon={apartmentIcon}
                    />
                )}
            </MapContainer>
        </div>
    );
}
