import type { ChatItem, Message } from "./ChatTypes";
import type { RefObject } from "react";

type ChatWindowProps = {
    selectedChat: ChatItem | undefined;
    newChatUserId: string | null;
    newChatUsername: string | null;
    messages: Message[];
    message: string;
    setMessage: (message: string) => void;
    messagesContainerRef: RefObject<HTMLDivElement | null>;
    showMobileChat: boolean;
    setShowMobileChat: (show: boolean) => void;
    handleSendMessage: () => void;
};

export default function ChatWindow({
    selectedChat,
    newChatUserId,
    newChatUsername,
    messages,
    message,
    setMessage,
    messagesContainerRef,
    showMobileChat,
    setShowMobileChat,
    handleSendMessage,
}: ChatWindowProps) {
    return (
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
    );
}