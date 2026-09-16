import * as db from "../services/DatabaseService";
import type { ApartmentImage } from "../../types/Apartment";

export async function prepareApartments<T extends {
    id: string;
    neighborhood_id: string;
}>(
    apartments: T[]
): Promise<(T & {
    neighborhood: string;
    images: ApartmentImage[];
})[] | null> {
    const apartmentsWithNeighborhoods = await Promise.all(
        apartments.map(async (apartment) => {
            const { data: neighborhoodData, error: neighborhoodError } =
                await db.getNeighborhoodById(apartment.neighborhood_id);

            if (neighborhoodError) {
                console.error(
                    "Error loading neighborhood:",
                    neighborhoodError
                );
            }

            return {
                ...apartment,
                neighborhood: neighborhoodData?.name ?? "",
            };
        })
    );

    const apartmentIds = apartments.map(
        (apartment) => apartment.id
    );

    let imagesData: ApartmentImage[] = [];

    if (apartmentIds.length > 0) {
        const { data, error: imagesError } =
            await db.getApartmentsImages(apartmentIds);

        if (imagesError) {
            console.error("Error loading images:", imagesError);
            return null;
        }

        imagesData = data ?? [];
    }

    return apartmentsWithNeighborhoods.map((apartment) => ({
        ...apartment,
        images: imagesData.filter(
            (image) => image.apartment_id === apartment.id
        ),
    }));
}