interface SystemMessageProps {
    text: string
    subtitle?: string
}

export function SystemMessage({ text, subtitle }: SystemMessageProps) {
    if (!subtitle) {
        return (
            <div className="flex justify-center px-4 py-2">
                <span className="rounded-full bg-muted px-3 py-0.5 text-xs text-muted-foreground">
                    {text}
                </span>
            </div>
        )
    }

    return (
        <div className="flex justify-center px-4 py-2">
            <div className="max-w-[75%] rounded-xl bg-muted px-4 py-2.5 text-center">
                <p className="text-xs font-semibold text-foreground/80">{text}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{subtitle}</p>
            </div>
        </div>
    )
}
