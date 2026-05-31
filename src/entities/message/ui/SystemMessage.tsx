interface SystemMessageProps {
    text: string
}

export function SystemMessage({ text }: SystemMessageProps) {
    return (
        <div className="flex justify-center px-4 py-2">
            <span className="rounded-full bg-muted px-3 py-0.5 text-xs text-muted-foreground">
                {text}
            </span>
        </div>
    )
}
