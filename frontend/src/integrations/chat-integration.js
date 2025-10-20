import { API_BASE, POST_STREAM_CHAT_PATH, GET_LIST_HISTORY_PATH, POST_UPDATE_CHAT_TITLE_PATH, GET_CHAT_HIST_REPORT_PATH, POST_STREAM_CHAT_V2_PATH } from "../config";

// v1 chat stream
export async function postChatStreamingAPI(payload) {
    const response = await fetch(API_BASE + POST_STREAM_CHAT_PATH, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    let replyMessage = '';
    const flushLines = () => {
      // SSE messages are separated by a blank line: \n\n
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        // Collect lines starting with "data:"
        const dataLines = rawEvent
          .split('\n')
          .filter(l => l.startsWith('data:'))
          .map(l => l.slice(5).trim());

        if (dataLines.length === 0) continue;

        const joined = dataLines.join('\n');
        try {
          const msg = JSON.parse(joined);
          if (msg.delta) replyMessage += msg.delta;
          if (msg.error) throw new Error(msg.error);
          if (msg.done) {
            return true; // signal completion
          }
        } catch (e) {
            console.log(e);
        }
      }
      return false;
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const finished = flushLines();
      if (finished) break;
    }

    // flush any remaining (optional)
    flushLines();
    return replyMessage;
}

// v2 chat stream + upload file ocr
export async function postChatStreamingV2API(payload, attachmentFiles = []) {
    const formData = new FormData();

    formData.append('payload', JSON.stringify(payload));

    if (attachmentFiles?.length) {
      attachmentFiles.forEach((file) => {
        formData.append("files", file, file.name);
      });
    }

    const response = await fetch(API_BASE + POST_STREAM_CHAT_V2_PATH, {
        method: 'POST',
        body: formData
    });

    if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    let replyMessage = '';
    const flushLines = () => {
      // SSE messages are separated by a blank line: \n\n
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        // Collect lines starting with "data:"
        const dataLines = rawEvent
          .split('\n')
          .filter(l => l.startsWith('data:'))
          .map(l => l.slice(5).trim());

        if (dataLines.length === 0) continue;

        const joined = dataLines.join('\n');
        try {
          const msg = JSON.parse(joined);
          if (msg.delta) replyMessage += msg.delta;
          if (msg.error) throw new Error(msg.error);
          if (msg.done) {
            return true; // signal completion
          }
        } catch (e) {
            console.log(e);
        }
      }
      return false;
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const finished = flushLines();
      if (finished) break;
    }

    // flush any remaining (optional)
    flushLines();
    return replyMessage;
}

export async function retrieveChatHistory({ userId, assistantId }) {
  const response = await fetch(API_BASE + GET_LIST_HISTORY_PATH + `?userId=${userId}&assistantId=${assistantId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const json = await response.json();
  let data = [];
  if (json?.data) {
    data = json?.data;
  }

  return data;
}

export async function doUpdateChatTitle({ sessionId, title }) {
  const response = await fetch(API_BASE + POST_UPDATE_CHAT_TITLE_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId,
      title
    })
  });

  const json = await response.json();
  let chatData = null;
  if (json?.data) {
    chatData = json?.data;
  }

  return chatData;
}

export async function doDownloadChatHistReport(sessionId) {
  const response = await fetch(API_BASE + GET_CHAT_HIST_REPORT_PATH + `/${sessionId}`);

  const cd = response.headers.get('Content-Disposition') || '';
  const match = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)/i);
  const filename = match ? decodeURIComponent(match[1]) : `report-${Date.now()}.pdf`;

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

   // Trigger a download
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}