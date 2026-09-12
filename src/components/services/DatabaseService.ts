import { supabase } from "../../lib/supabase";

export async function getConversation(conversationId: string) {
    return await supabase
        .from("Conversations")
        .select(
            "id, user1_id, user2_id, user1_last_read_at, user2_last_read_at"
        )
        .eq("id", conversationId)
        .single();
}

export async function getProfile(userId: string) {
    return await supabase
        .from("Profiles")
        .select("id, username, profile_picture_path")
        .eq("id", userId)
        .single();
}

export async function getUser() {
    return await supabase.auth.getUser();
}

export async function getMessages(conversationId: string, limit: number) {
    return await supabase
        .from("Messages")
        .select("id, content, sender_id, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(limit);
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
    return await supabase
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
    return await supabase
        .from("Conversations")
        .select(
            "id, user1_id, user2_id, updated_at, user1_last_read_at, user2_last_read_at"
        )
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order("updated_at", { ascending: false });
}

export async function updateConversationReadAt( conversationId: string, column: string) {
    const now = new Date().toISOString();

    return await supabase
        .from("Conversations")
        .update({ [column]: now })
        .eq("id", conversationId);
}

export async function getConversationBetweenUsers(user1Id: string, user2Id: string) {
    return await supabase
        .from("Conversations")
        .select("id")
        .eq("user1_id", user1Id)
        .eq("user2_id", user2Id)
        .maybeSingle();
}

export async function createConversation(user1Id: string, user2Id: string) {
    return await supabase
        .from("Conversations")
        .insert({
            user1_id: user1Id,
            user2_id: user2Id,
        })
        .select("id")
        .single();
}

export async function updateConversationTimestamp(conversationId: string) {
    return await supabase
        .from("Conversations")
        .update({
            updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
}

export async function getApartmentById(id: string) {
    return await supabase
        .from("Apartments")
        .select("*")
        .eq("id", id)
        .single();
}

export async function deleteApartment(apartmentId: string, creatorId: string) {
    return await supabase
        .from("Apartments")
        .delete()
        .eq("id", apartmentId)
        .eq("creator_id", creatorId);
}

export async function getApartmentImages(apartmentId: string) {
    return await supabase
        .from("ApartmentImages")
        .select("id, apartment_id, image_path")
        .eq("apartment_id", apartmentId);
}

export async function deleteApartmentImageRecords(apartmentId: string) {
    return await supabase
        .from("ApartmentImages")
        .delete()
        .eq("apartment_id", apartmentId);
}

export async function getNeighborhoodById(id: string) {
    return await supabase
        .from("Neighborhoods")
        .select("name")
        .eq("id", id)
        .single();
}

export function getApartmentImageUrl(imagePath: string) {
    return supabase.storage
        .from("apartment-images")
        .getPublicUrl(imagePath)
        .data.publicUrl;
}

export async function listApartmentFolder(apartmentFolder: string) {
    return await supabase.storage
        .from("apartment-images")
        .list(apartmentFolder);
}

export async function deleteApartmentFolderPlaceholder(apartmentFolder: string) {
    return await supabase.storage
        .from("apartment-images")
        .remove([
            `${apartmentFolder}/.emptyFolderPlaceholder`,
        ]);
}

export async function deleteApartmentImages(imagePaths: string[]) {
    return await supabase.storage
        .from("apartment-images")
        .remove(imagePaths);
}

export function getProfileImageUrl(imagePath: string) {
    return supabase.storage
        .from("profile-pictures")
        .getPublicUrl(imagePath)
        .data.publicUrl;
}
