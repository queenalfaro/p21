import { createBrowserRouter, RouterProvider, Navigate } from "react-router"
import { UserGuard } from "@/app/guards/UserGuard"
import { RoomLayout } from "@/app/layouts/RoomLayout"
import { HomePage } from "@/pages/home"
import { OnboardingPage } from "@/pages/onboarding"
import { UserProfilePage } from "@/pages/user-profile"
import { CreateRoomPage } from "@/pages/create-room"
import { JoinRoomPage } from "@/pages/join-room"
import { ScanPage } from "@/pages/scan"
import { SharePage } from "@/pages/share"
import { RoomPage } from "@/pages/room"
import { RoomSettingsPage } from "@/pages/room-settings"
import { RoomAnalyticsPage } from "@/pages/room-analytics"

const router = createBrowserRouter([
    {
        element: <UserGuard />,
        children: [
            { path: "/", element: <HomePage /> },
            { path: "/profile", element: <UserProfilePage /> },
            { path: "/create-room", element: <CreateRoomPage /> },
            { path: "/join/:roomname", element: <JoinRoomPage /> },
            { path: "/scan", element: <ScanPage /> },
            // Room routes share RoomLayout so analytics mounts once per room visit
            {
                path: "/room/:id",
                element: <RoomLayout />,
                children: [
                    { index: true, element: <RoomPage /> },
                    { path: "settings", element: <RoomSettingsPage /> },
                    { path: "analytics", element: <RoomAnalyticsPage /> },
                    { path: "share", element: <SharePage /> },
                ],
            },
            { path: "*", element: <Navigate to="/" replace /> },
        ],
    },
    {
        path: "/onboarding",
        element: (
            <div className="mx-auto min-h-svh max-w-[480px] bg-background">
                <OnboardingPage />
            </div>
        ),
    },
])

export function AppRouter() {
    return <RouterProvider router={router} />
}
