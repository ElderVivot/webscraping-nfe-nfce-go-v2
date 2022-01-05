export function treatText (text: string): string {
    return text.trim().normalize('NFD').replace(/([\u0300-\u036f]|[^0-9a-zA-Z.!+:><=)?$(/*,\-_ \\])/g, '').toUpperCase()
}