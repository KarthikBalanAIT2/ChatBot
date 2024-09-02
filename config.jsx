const server = {
    BASE_URL : 'https://721b-14-102-2-74.ngrok-free.app',
}
const config ={
    ...server,

    external_chat: `${server.BASE_URL}/api/v1/external-chat`,
    feedback_chat: `${server.BASE_URL}/api/v1/chat-feedback`,
    API_KEY : window?.chat_key || '',
}

export default config;