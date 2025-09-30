const SYSTEM_PATH = path.resolve('prompts/sg_doctor_recomendation_prompt.md');
function loadSystemPrompt() {
    if (!fs.existsSync(SYSTEM_PATH)) {
        throw new Error('prompts/sg_doctor_recomendation_prompt.md');
    }

    return fs.readFileSync(SYSTEM_PATH, 'utf-8');
}
let SYSTEM_PROMPT = loadSystemPrompt();

// Reload System Prompt
app.post('/admin/reload', (_req, res) => {
    try { 
        SYSTEM_PROMPT = loadSystemPrompt(); 
        res.json({ ok: true }); 
    }
    catch (e) { 
        res.status(500).json({ ok: false, error: e.message }); 
    }
});

// ---------- Non-streaming ----------
async function doStreamChat(req, res) {
  try {
    let history = [];
    const { assistantId, chatId, message } = req.body;

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await client.responses.create({
        model: MODEL,
        instructions: SYSTEM_PROMPT,
        input: [
            { role: 'system', content: 'Answer strictly from your system knowledge.' },
            ...history,
            { role: 'user', content: message }
        ],
        stream: true,
        tools: [{ type: 'file_search' }],
        tool_resources: {
        file_search: {
            vector_store_ids: [process.env.VECTOR_STORE_ID] // <-- REQUIRED
        }
    },
    });

    // Store User Messages
    history.push({ role: "user", content: message });
    
    let msg = '';
    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        msg += event.delta;
        res.write(`data: ${JSON.stringify({ delta: event.delta })}\n\n`);
      } else if (event.type === 'response.completed') {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      } else if (event.type === 'error') {
        res.write(`data: ${JSON.stringify({ error: event.error })}\n\n`);
      }
    }

    // Store Assistant Messages
    history.push({ role: "assistant", content: msg });


    console.log(msg);

    res.end();
  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
    res.end();
  }
}



module.exports = {
  doStreamChat
};