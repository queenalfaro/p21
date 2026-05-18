import { useState, type MouseEvent } from "react";

import { sendMessage } from "../services/messages";

export function MessagesInput() {
    const [text, setText] = useState("");

    function onClick(e: MouseEvent) {
        e.preventDefault();
        sendMessage(text);
        setText("");
    }

    return (
        <div>
            <input
                type="text"
                value={text}
                placeholder="Type a message..."
                onChange={(e) => {
                    setText(e.target.value);
                }}
            />
            <button disabled={!text.trim()} onClick={onClick}>
                Send
            </button>
        </div>
    );
}
