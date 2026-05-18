import { Link } from "react-router-dom";

import { MessagesList } from "@/features/messages/components/MessagesList";
import { MessagesInput } from "@/features/messages/components/MessageInput";

export function RoomPage() {
    return (
        <div>
            <h1>ROOM</h1>
            <Link to={"/"}>
                <button>Go To Home</button>
            </Link>
            <br />
            <MessagesList />
            <MessagesInput />
        </div>
    );
}
