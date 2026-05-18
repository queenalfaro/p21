import { Link } from "react-router-dom";

export function HomePage() {
    return (
        <div>
            <h1>HOME</h1>
            <Link to={"/create-room"}>
                <button>Go To Room Creation Page</button>
            </Link>
        </div>
    );
}
