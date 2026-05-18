import { use, useState, useEffect } from "react";
import { getMessagesList, subscribeToRoom } from "../services/messages";

const initMessagesPromise = getMessagesList();

export function MessagesList() {
    const initMessages = use(initMessagesPromise);
    const [messages, setMessages] = useState(initMessages);

    useEffect(() => {
        const unsubscribe = subscribeToRoom((newMessage) => {
            setMessages((prev) => [...prev, newMessage]);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div>
            <ul>
                {messages?.map((m) => (
                    <li key={m.id}>{m.text}</li>
                ))}
            </ul>
        </div>
    );
}
