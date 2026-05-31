const STORAGE_KEY = "event-app:user-id"

export function getCurrentUserId(): string {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem(STORAGE_KEY, id)
    }
    return id
}
