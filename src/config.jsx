const server = {
    BASE_URL : import.meta.env.VITE_API_BACKEND_URL
}

const config ={
    ...server,

    external_chat: `${server.BASE_URL}/api/v1/external-chat`,
    feedback_chat: `${server.BASE_URL}/api/v1/chat-feedback`,
}

export default config;