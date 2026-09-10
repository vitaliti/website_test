import { supabase } from "../../../lib/supabase";
import type { ChatItem, Conversation } from "./ChatTypes";

type ChatListProps = {
    chats: ChatItem[];
    selectedChatId: string | null;
    setSelectedChatId: (id: string) => void;
    setNewChatUserId: (id: string | null) => void;
    setNewChatUsername: (username: string | null) => void;
    setShowMobileChat: (show: boolean) => void;
    showMobileChat: boolean;
    markConversationAsRead: (conversation: Conversation) => Promise<void>;
};

export default function ChatList({
    chats,
    selectedChatId,
    setSelectedChatId,
    setNewChatUserId,
    setNewChatUsername,
    setShowMobileChat,
    showMobileChat,
    markConversationAsRead,
}: ChatListProps) {
    return (
        <section
            className={`chat-list ${
                showMobileChat ? "mobile-hidden" : ""
            }`}
        >
            <h1>Chats</h1>

            {chats.length === 0 ? (
                <p>No chats started yet.</p>
            ) : (
                chats.map((chat) => (
                    <button
                        key={chat.id}
                        className={`chat-list-item ${
                            selectedChatId === chat.id ? "active" : ""
                        } ${
                            chat.unread ? "unread" : ""
                        }`}
                        onClick={async () => {
                            setSelectedChatId(chat.id);
                            setNewChatUserId(null);
                            setNewChatUsername(null);
                            setShowMobileChat(true);

                            const conversation = await supabase
                                .from("Conversations")
                                .select(
                                    "id, user1_id, user2_id, user1_last_read_at, user2_last_read_at"
                                )
                                .eq("id", chat.id)
                                .single();

                            if (conversation.data) {
                                await markConversationAsRead(
                                    conversation.data as Conversation
                                );
                            }
                        }}
                    >
                        <div className="chat-list-name">
                            <strong>{chat.name}</strong>
                            {chat.unread && (<span className="unread-dot"></span>)}
                        </div>

                        <span>{chat.lastMessage}</span>
                    </button>
                ))
            )}
        </section>
    );
}