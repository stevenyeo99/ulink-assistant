import { API_BASE, POST_SESSION_PATH } from "../config";

export async function postNewSession(payload) {
  const response = await fetch(API_BASE + POST_SESSION_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const responseData = await response.json();
  let chatSession = null;
  if (responseData && responseData?.data?.chat) {
    chatSession = responseData?.data?.chat;
  }

  return chatSession;
}