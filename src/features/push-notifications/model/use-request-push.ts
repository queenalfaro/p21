/**
 * Stub: requests Notification permission.
 * Full VAPID subscription + server registration is deferred (FCM phase).
 */
export function useRequestPush() {
    async function requestPermission(): Promise<NotificationPermission> {
        if (typeof Notification === "undefined") return "denied"
        return Notification.requestPermission()
        // TODO (FCM phase): subscribe to push, send subscription to Edge Function
    }

    return { requestPermission }
}
