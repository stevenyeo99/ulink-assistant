import { API_BASE, GET_LIST_USERS, POST_CREATE_USER } from "../config";

export async function postNewUser(payload) {
  const response = await fetch(API_BASE + POST_CREATE_USER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const responseData = await response.json();
  return responseData;
}

export async function getListOfUsers() {
    const response = await fetch(API_BASE + GET_LIST_USERS, {
        method: 'GET',
        headers: {
        'Content-Type': 'application/json'
        },
    });

    const responseData = await response.json();
    return responseData;
}