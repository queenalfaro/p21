import { Link } from "react-router-dom";

export function CreateRoomPage() {
    return (
        <div>
            <h1>CREATE ROOM</h1>
            <Link to={"/room"}>
                <button>Go To Room</button>
            </Link>
        </div>
    );
}
