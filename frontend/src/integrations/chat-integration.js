import { API_BASE, POST_STREAM_CHAT_PATH } from "../config";

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