import "./index.css"
import { Providers } from "./providers"
import { AppRouter } from "./router"
import { PwaPrompts } from "./pwa/PwaPrompts"

export function App() {
    return (
        <Providers>
            <AppRouter />
            <PwaPrompts />
        </Providers>
    )
}
