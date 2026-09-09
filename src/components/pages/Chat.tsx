import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./Chat.css";
import { supabase } from "../../lib/supabase";

type ChatItem = {
    id: string;
    name: string;
    lastMessage: string;
};

type Message = {
    id: string;
    sender: "me" | "them";
    text: string;
};

type Conversation = {
    id: string;
    user1_id: string;
    user2_id: string;
};

type Profile = {
    id: string;
    username: string;
};

export default function Chat() {
    const [searchParams] = useSearchParams();

    const conversationIdFromUrl =
        searchParams.get("conversation");

    const userIdFromUrl =
        searchParams.get("user");

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [newChatUserId, setNewChatUserId] = useState<string | null>(null);
    const [newChatUsername, setNewChatUsername] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [showMobileChat, setShowMobileChat] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);

    const selectedChat = chats.find(
        (chat) => chat.id === selectedChatId
    );

    useEffect(() => {
        loadChats();
    }, [conversationIdFromUrl, userIdFromUrl]);

    useEffect(() => {
        if (selectedChatId) {
            loadMessages(selectedChatId);
        } else {
            setMessages([]);
        }
    }, [selectedChatId]);

    /*
     * REALTIME:
     *
     * Listen for new messages.
     *
     * This does two things:
     * 1. Adds the message immediately if its conversation is open.
     * 2. Updates/adds the conversation in the chat list.
     */
    useEffect(() => {
        if (!currentUserId) {
            return;
        }

        const channel = supabase
            .channel("user-messages")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "Messages",
                },
                async (payload) => {
                    const newMessage = payload.new as {
                        id: string;
                        conversation_id: string;
                        sender_id: string;
                        content: string;
                    };

                    /*
                     * Get the conversation that this message belongs to.
                     */
                    const { data: conversation, error: conversationError } =
                        await supabase
                            .from("Conversations")
                            .select("id, user1_id, user2_id")
                            .eq("id", newMessage.conversation_id)
                            .maybeSingle();

                    if (conversationError || !conversation) {
                        return;
                    }

                    /*
                     * Ignore conversations where the current user
                     * is not a participant.
                     */
                    const isParticipant =
                        conversation.user1_id === currentUserId ||
                        conversation.user2_id === currentUserId;

                    if (!isParticipant) {
                        return;
                    }

                    /*
                     * If this is the conversation currently being viewed,
                     * immediately add the new message.
                     */
                    if (selectedChatId === newMessage.conversation_id) {
                        setMessages((previousMessages) => {
                            /*
                             * Prevent our own message from being added twice.
                             *
                             * handleSendMessage() adds our message immediately,
                             * and Realtime will also send the INSERT event.
                             */
                            if (
                                previousMessages.some(
                                    (msg) => msg.id === newMessage.id
                                )
                            ) {
                                return previousMessages;
                            }

                            return [
                                ...previousMessages,
                                {
                                    id: newMessage.id,
                                    sender:
                                        newMessage.sender_id === currentUserId
                                            ? "me"
                                            : "them",
                                    text: newMessage.content,
                                },
                            ];
                        });
                    }

                    /*
                     * Check whether this conversation is already in
                     * our chat list.
                     */
                    let chatExists = false;

                    setChats((previousChats) => {
                        const existingChat = previousChats.find(
                            (chat) =>
                                chat.id === newMessage.conversation_id
                        );

                        if (existingChat) {
                            chatExists = true;

                            /*
                             * Update the last message and move this
                             * conversation to the top.
                             */
                            return [
                                {
                                    ...existingChat,
                                    lastMessage: newMessage.content,
                                },
                                ...previousChats.filter(
                                    (chat) =>
                                        chat.id !== newMessage.conversation_id
                                ),
                            ];
                        }

                        return previousChats;
                    });

                    /*
                     * If the conversation was not already in the chat list,
                     * it is a new conversation for this user.
                     *
                     * Add it to the list immediately.
                     */
                    if (!chatExists) {
                        const otherUserId =
                            conversation.user1_id === currentUserId
                                ? conversation.user2_id
                                : conversation.user1_id;

                        const { data: profile, error: profileError } =
                            await supabase
                                .from("Profiles")
                                .select("id, username")
                                .eq("id", otherUserId)
                                .single();

                        if (profileError || !profile) {
                            console.error(
                                "Could not load profile for new conversation:",
                                profileError
                            );
                            return;
                        }

                        setChats((previousChats) => {
                            /*
                             * Check again because the chat may have been
                             * added while we were loading the profile.
                             */
                            const existingChat = previousChats.find(
                                (chat) =>
                                    chat.id === newMessage.conversation_id
                            );

                            if (existingChat) {
                                return [
                                    {
                                        ...existingChat,
                                        lastMessage: newMessage.content,
                                    },
                                    ...previousChats.filter(
                                        (chat) =>
                                            chat.id !==
                                            newMessage.conversation_id
                                    ),
                                ];
                            }

                            return [
                                {
                                    id: newMessage.conversation_id,
                                    name: (profile as Profile).username,
                                    lastMessage: newMessage.content,
                                },
                                ...previousChats,
                            ];
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId, selectedChatId]);

    useEffect(() => {
        if (messages.length === 0) {
            return;
        }

        const container = messagesContainerRef.current;

        if (!container) {
            return;
        }

        container.scrollTop = container.scrollHeight;
    }, [messages]);

    const loadChats = async () => {
        setLoading(true);

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error("Could not get logged-in user:", userError);
            setLoading(false);
            return;
        }

        setCurrentUserId(user.id);

        const { data: conversations, error: conversationsError } =
            await supabase
                .from("Conversations")
                .select("id, user1_id, user2_id")
                .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                .order("updated_at", { ascending: false });

        if (conversationsError) {
            console.error(
                "Could not load conversations:",
                conversationsError
            );
            setLoading(false);
            return;
        }

        const chatItems: ChatItem[] = [];

        for (const conversation of (conversations ?? []) as Conversation[]) {
            const otherUserId =
                conversation.user1_id === user.id
                    ? conversation.user2_id
                    : conversation.user1_id;

            const { data: profile, error: profileError } = await supabase
                .from("Profiles")
                .select("id, username")
                .eq("id", otherUserId)
                .single();

            if (profileError) {
                console.error(
                    "Could not load profile:",
                    profileError
                );
                continue;
            }

            const { data: lastMessage, error: messageError } =
                await supabase
                    .from("Messages")
                    .select("content")
                    .eq("conversation_id", conversation.id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

            if (messageError) {
                console.error(
                    "Could not load last message:",
                    messageError
                );
            }

            chatItems.push({
                id: conversation.id,
                name: (profile as Profile).username,
                lastMessage: lastMessage?.content ?? "No messages yet",
            });
        }

        setChats(chatItems);

        /*
         * If the URL contains an existing conversation,
         * open that conversation.
         */
        if (conversationIdFromUrl) {
            const existingChat = chatItems.find(
                (chat) => chat.id === conversationIdFromUrl
            );

            if (existingChat) {
                setSelectedChatId(existingChat.id);
                setNewChatUserId(null);
                setNewChatUsername(null);
                setShowMobileChat(true);
            }
        }

        /*
         * If the URL contains a user instead, this is a new
         * conversation that has not been created yet.
         */
        else if (userIdFromUrl) {
            const existingConversation = (conversations ?? []).find(
                (conversation: Conversation) =>
                    conversation.user1_id === userIdFromUrl ||
                    conversation.user2_id === userIdFromUrl
            );

            if (existingConversation) {
                setSelectedChatId(existingConversation.id);
                setNewChatUserId(null);
                setNewChatUsername(null);
                setShowMobileChat(true);
            } else {
                const { data: profile, error: profileError } =
                    await supabase
                        .from("Profiles")
                        .select("id, username")
                        .eq("id", userIdFromUrl)
                        .single();

                if (profileError) {
                    console.error(
                        "Could not load new chat user:",
                        profileError
                    );
                } else {
                    setSelectedChatId(null);
                    setNewChatUserId(profile.id);
                    setNewChatUsername(profile.username);
                    setMessages([]);
                    setShowMobileChat(true);
                }
            }
        }

        /*
         * Normal /chat with no parameters.
         * Open the first existing conversation.
         */
        else {
            setSelectedChatId(null);
            setNewChatUserId(null);
            setNewChatUsername(null);
            setMessages([]);
            setShowMobileChat(false);
        }

        setLoading(false);
    };

    const loadMessages = async (conversationId: string) => {
        if (!currentUserId) {
            return;
        }

        const { data, error } = await supabase
            .from("Messages")
            .select("id, sender_id, content")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) {
            console.error("Could not load messages:", error);
            return;
        }

        const loadedMessages: Message[] = (data ?? [])
            .reverse()
            .map((msg) => ({
                id: msg.id,
                sender: msg.sender_id === currentUserId ? "me" : "them",
                text: msg.content,
        }));

        setMessages(loadedMessages);
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !currentUserId) {
            return;
        }

        const text = message.trim();

        let conversationId = selectedChatId;
        let isNewConversation = false;

        if (!conversationId && newChatUserId) {
            const user1Id =
                currentUserId < newChatUserId
                    ? currentUserId
                    : newChatUserId;

            const user2Id =
                currentUserId < newChatUserId
                    ? newChatUserId
                    : currentUserId;

            const {
                data: existingConversation,
                error: existingConversationError,
            } = await supabase
                .from("Conversations")
                .select("id")
                .eq("user1_id", user1Id)
                .eq("user2_id", user2Id)
                .maybeSingle();

            if (existingConversationError) {
                console.error(
                    "Could not check for existing conversation:",
                    existingConversationError
                );
                return;
            }

            if (existingConversation) {
                conversationId = existingConversation.id;
            } else {
                const {
                    data: newConversation,
                    error: createError,
                } = await supabase
                    .from("Conversations")
                    .insert({
                        user1_id: user1Id,
                        user2_id: user2Id,
                    })
                    .select("id")
                    .single();

                if (createError) {
                    console.error(
                        "Could not create conversation:",
                        createError
                    );
                    return;
                }

                conversationId = newConversation.id;
                isNewConversation = true;
            }
        }

        if (!conversationId) {
            return;
        }

        const { data: newMessage, error } = await supabase
            .from("Messages")
            .insert({
                conversation_id: conversationId,
                sender_id: currentUserId,
                content: text,
            })
            .select("id, sender_id, content")
            .single();

        if (error) {
            console.error("Could not send message:", error);
            return;
        }

        /*
         * Add our message immediately.
         *
         * The Realtime listener will also receive it, but it checks
         * the ID first so it will not be duplicated.
         */
        setMessages((previousMessages) => {
            if (
                previousMessages.some(
                    (msg) => msg.id === newMessage.id
                )
            ) {
                return previousMessages;
            }

            return [
                ...previousMessages,
                {
                    id: newMessage.id,
                    sender: "me",
                    text: newMessage.content,
                },
            ];
        });

        if (isNewConversation) {
            setChats((previousChats) => [
                {
                    id: conversationId!,
                    name: newChatUsername ?? "Unknown user",
                    lastMessage: text,
                },
                ...previousChats,
            ]);

            setSelectedChatId(conversationId);
            setNewChatUserId(null);
            setNewChatUsername(null);
        } else {
            setChats((previousChats) => {
                const updatedChat = previousChats.find(
                    (chat) => chat.id === conversationId
                );

                if (!updatedChat) {
                    return previousChats;
                }

                return [
                    {
                        ...updatedChat,
                        lastMessage: text,
                    },
                    ...previousChats.filter(
                        (chat) => chat.id !== conversationId
                    ),
                ];
            });
        }

        setMessage("");
    };

    if (loading) {
        return (
            <main className="chat-page">
                <section className="chat-list">
                    <h1>Chats</h1>
                    <p>Loading chats...</p>
                </section>

                <section className="chat-window">
                    <p>Loading...</p>
                </section>
            </main>
        );
    }

    return (
        <main className="chat-page">
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
                            }`}
                            onClick={() => {
                                setSelectedChatId(chat.id);
                                setNewChatUserId(null);
                                setNewChatUsername(null);
                                setShowMobileChat(true);
                            }}
                        >
                            <strong>{chat.name}</strong>
                            <span>{chat.lastMessage}</span>
                        </button>
                    ))
                )}
            </section>

            <section
                className={`chat-window ${
                    showMobileChat ? "mobile-visible" : ""
                }`}
            >
                {selectedChat ? (
                    <>
                        <header className="chat-header">
                            <button
                                className="chat-back-button"
                                onClick={() => setShowMobileChat(false)}
                            >
                                ←
                            </button>

                            <h2>{selectedChat.name}</h2>
                        </header>

                        <div className="messages" ref={messagesContainerRef}>
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`message ${
                                        msg.sender === "me"
                                            ? "message-me"
                                            : "message-them"
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            ))}
                        </div>

                        <div className="message-input">
                            <input
                                type="text"
                                placeholder="Write a message..."
                                value={message}
                                onChange={(event) =>
                                    setMessage(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        handleSendMessage();
                                    }
                                }}
                            />

                            <button onClick={handleSendMessage}>
                                Send
                            </button>
                        </div>
                    </>
                ) : newChatUserId ? (
                    <>
                        <header className="chat-header">
                            <button
                                className="chat-back-button"
                                onClick={() => setShowMobileChat(false)}
                            >
                                ←
                            </button>

                            <h2>{newChatUsername}</h2>
                        </header>

                        <div className="messages" ref={messagesContainerRef}>
                            <p>Start a conversation.</p>
                        </div>

                        <div className="message-input">
                            <input
                                type="text"
                                placeholder="Write a message..."
                                value={message}
                                onChange={(event) =>
                                    setMessage(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        handleSendMessage();
                                    }
                                }}
                            />

                            <button onClick={handleSendMessage}>
                                Send
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="chat-empty">
                        <p>Select a chat to start messaging.</p>
                    </div>
                )}
            </section>
        </main>
    );
}
