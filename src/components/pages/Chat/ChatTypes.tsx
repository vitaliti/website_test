export type ChatItem = {
    id: string;
    name: string;
    lastMessage: string;
    unread: boolean;
};

export type Message = {
    id: string;
    sender: "me" | "them";
    text: string;
};

export type Conversation = {
    id: string;
    user1_id: string;
    user2_id: string;
    updated_at: string;
    user1_last_read_at: string | null;
    user2_last_read_at: string | null;
};

export type Profile = {
    id: string;
    username: string;
};