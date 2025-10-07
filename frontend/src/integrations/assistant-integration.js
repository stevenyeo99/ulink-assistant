import { API_BASE, GET_LIST_ASSISTANT_PATH } from "../config";

export async function getListOfAssistant() {
  const response = await fetch(API_BASE + GET_LIST_ASSISTANT_PATH, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  const activeAssistant = data.filter(d => d.enabled === true);
  
  return activeAssistant;
}