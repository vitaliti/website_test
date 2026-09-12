import { supabase } from "../../lib/supabase";

export async function signUp(email: string, password: string) {
    return supabase.auth.signUp({
        email,
        password,
    });
}

export async function signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({
        email,
        password,
    });
}

export async function getSession() {
    return supabase.auth.getSession();
}

export function onAuthStateChange(callback: (session: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
        callback(session);
    });
}

export async function getConversation(conversationId: string) {
    return supabase
        .from("Conversations")
        .select(
            "id, user1_id, user2_id, user1_last_read_at, user2_last_read_at"
        )
        .eq("id", conversationId)
        .single();
}

export async function getProfile(userId: string) {
    return supabase
        .from("Profiles")
        .select("id, username, profile_picture_path")
        .eq("id", userId)
        .single();
}

export async function getUser() {
    return supabase.auth.getUser();
}

export async function getMessages(conversationId: string, limit: number) {
    return supabase
        .from("Messages")
        .select("id, content, sender_id, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(limit);
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
    return supabase
        .from("Messages")
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content: content,
        })
        .select("id, sender_id, content")
        .single();
}

export async function getUserConversations(userId: string) {
    return supabase
        .from("Conversations")
        .select(
            "id, user1_id, user2_id, updated_at, user1_last_read_at, user2_last_read_at"
        )
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order("updated_at", { ascending: false });
}

export async function updateConversationReadAt( conversationId: string, column: string) {
    const now = new Date().toISOString();

    return supabase
        .from("Conversations")
        .update({ [column]: now })
        .eq("id", conversationId);
}

export async function getConversationBetweenUsers(user1Id: string, user2Id: string) {
    return supabase
        .from("Conversations")
        .select("id")
        .eq("user1_id", user1Id)
        .eq("user2_id", user2Id)
        .maybeSingle();
}

export async function createConversation(user1Id: string, user2Id: string) {
    return supabase
        .from("Conversations")
        .insert({
            user1_id: user1Id,
            user2_id: user2Id,
        })
        .select("id")
        .single();
}

export async function updateConversationTimestamp(conversationId: string) {
    return supabase
        .from("Conversations")
        .update({
            updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
}

export async function createApartment(
    creatorId: string,
    city: string,
    neighborhoodId: string,
    price: number,
    floor: number,
    rooms: number,
    storage: boolean,
    ac: boolean,
    garage: boolean
) {
    return supabase
        .from("Apartments")
        .insert({
            creator_id: creatorId,
            city,
            neighborhood_id: neighborhoodId,
            price,
            floor,
            rooms,
            storage,
            ac,
            garage,
        })
        .select()
        .single();
}

export async function createApartmentImageRecord(
    apartmentId: string,
    imagePath: string,
    displayOrder: number
) {
    return supabase
        .from("ApartmentImages")
        .insert({
            apartment_id: apartmentId,
            image_path: imagePath,
            display_order: displayOrder,
        });
}

export async function getFirstApartmentImage(apartmentId: string) {
    return supabase
        .from("ApartmentImages")
        .select("image_path")
        .eq("apartment_id", apartmentId)
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();
}

export async function searchApartments(
    city: string,
    neighborhoodId: string,
    price: string,
    floor: string,
    rooms: string,
    storage: boolean,
    ac: boolean,
    garage: boolean
) {
    let query = supabase
        .from("Apartments")
        .select(`
            id,
            city,
            neighborhood_id,
            price,
            floor,
            rooms,
            storage,
            ac,
            garage,
            Neighborhoods (
                name
            )
        `);

    if (city.trim() !== "") {
        query = query.ilike("city", `%${city.trim()}%`);
    }

    if (neighborhoodId !== "") {
        query = query.eq("neighborhood_id", neighborhoodId);
    }

    if (price !== "") {
        query = query.lte("price", Number(price));
    }

    if (floor !== "") {
        query = query.eq("floor", Number(floor));
    }

    if (rooms !== "") {
        query = query.eq("rooms", Number(rooms));
    }

    if (ac) {
        query = query.eq("ac", true);
    }

    if (storage) {
        query = query.eq("storage", true);
    }

    if (garage) {
        query = query.eq("garage", true);
    }

    return query;
}

export async function getApartmentById(id: string) {
    return supabase
        .from("Apartments")
        .select("*")
        .eq("id", id)
        .single();
}

export async function deleteApartment(apartmentId: string, creatorId: string) {
    return supabase
        .from("Apartments")
        .delete()
        .eq("id", apartmentId)
        .eq("creator_id", creatorId);
}

export async function getApartmentImages(apartmentId: string) {
    return supabase
        .from("ApartmentImages")
        .select("id, apartment_id, image_path")
        .eq("apartment_id", apartmentId);
}

export async function deleteApartmentImageRecords(apartmentId: string) {
    return supabase
        .from("ApartmentImages")
        .delete()
        .eq("apartment_id", apartmentId);
}

export async function getNeighborhoodById(id: string) {
    return supabase
        .from("Neighborhoods")
        .select("name")
        .eq("id", id)
        .single();
}

export async function getNeighborhoods() {
    return supabase
        .from("Neighborhoods")
        .select("id, name")
        .order("name");
}

export function getApartmentImageUrl(imagePath: string) {
    return supabase.storage
        .from("apartment-images")
        .getPublicUrl(imagePath)
        .data.publicUrl;
}

export async function uploadApartmentImage(filePath: string, picture: File) {
    return supabase.storage
        .from("apartment-images")
        .upload(filePath, picture, {
            contentType: picture.type,
            upsert: false,
        });
}

export async function listApartmentFolder(apartmentFolder: string) {
    return supabase.storage
        .from("apartment-images")
        .list(apartmentFolder);
}

export async function deleteApartmentFolderPlaceholder(apartmentFolder: string) {
    return supabase.storage
        .from("apartment-images")
        .remove([
            `${apartmentFolder}/.emptyFolderPlaceholder`,
        ]);
}

export async function deleteApartmentImages(imagePaths: string[]) {
    return supabase.storage
        .from("apartment-images")
        .remove(imagePaths);
}

export function getProfileImageUrl(imagePath: string) {
    return supabase.storage
        .from("profile-pictures")
        .getPublicUrl(imagePath)
        .data.publicUrl;
}
