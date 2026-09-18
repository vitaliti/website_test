export type ApartmentImage = {
    id: string;
    apartment_id: string;
    image_path: string;
};

export type Apartment = {
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
    latitude: number;
    longitude: number;
};