export type ChatMsg = { id: string; role: 'bot' | 'user' | 'loading'; text?: string }
export type ChatResponse = { answer?: string; token?: string }
