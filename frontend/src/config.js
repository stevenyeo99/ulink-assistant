export const API_BASE = import.meta.env.VITE_API_BASE?.trim() || "http://127.0.0.1:3000";



// API End-Point
export const LOGIN_PATH    = import.meta.env.VITE_LOGIN_PATH    || "/api/users/login";
export const REGISTER_PATH = import.meta.env.VITE_REGISTER_PATH || "/api/users/register";
export const PROFILE_PATH  = import.meta.env.VITE_PROFILE_PATH  || "/api/users/me";

export const GET_LIST_ASSISTANT_PATH = import.meta.env.GET_LIST_ASSISTANT_PATH || '/api/assistants';
export const POST_SESSION_PATH = import.meta.env.POST_SESSION_PATH || '/api/sessions';
export const POST_STREAM_CHAT_PATH = import.meta.env.POST_STREAM_CHAT_PATH || '/api/chats/stream';
export const POST_STREAM_CHAT_V2_PATH = import.meta.env.POST_STREAM_CHAT_PATH || '/api/chats/v2/stream';
export const GET_LIST_HISTORY_PATH = import.meta.env.GET_LIST_HISTORY_PATH || '/api/chats/history';
export const GET_LIST_MESSAGE_PER_SESSION_PATH = import.meta.env.GET_LIST_MESSAGE_PER_SESSION_PATH || '/api/chats/messages';
export const GET_CHAT_HIST_REPORT_PATH = import.meta.env.GET_CHAT_HIST_REPORT_PATH || '/api/chats/history/report';
export const POST_UPDATE_CHAT_TITLE_PATH = import.meta.env.POST_UPDATE_CHAT_TITLE_PATH || '/api/chats/title/update';
export const GET_EXPORT_ALL_CHAT_PATH = import.meta.env.GET_EXPORT_ALL_CHAT_PATH || '/api/chats/history/all/report';