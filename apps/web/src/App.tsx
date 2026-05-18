import { BrowserRouter, Routes, Route } from "react-router-dom";

import { HomePage } from "@/pages/HomePage";
import { CreateRoomPage } from "@/pages/CreateRoomPage";
import { RoomPage } from "@/pages/RoomPage";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/create-room" element={<CreateRoomPage />} />
                <Route path="/room" element={<RoomPage />} />
            </Routes>
        </BrowserRouter>
    );
}
