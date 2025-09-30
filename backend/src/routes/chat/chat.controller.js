const path = require('path');
const OpenAI = require('openai');
const fs = require('fs');

const { OPENAI_MODEL } = require('../../config');
const { asssistantMap, initSystemPromptMap } = require('../assistant/assistant.controller');


function loadSystemPrompt(assistantId) {

    let systemPrompt;
    if (assistantId) {
      const asstConf = asssistantMap.get(assistantId);

      if (asstConf && asstConf?.systemPromptFile) {
        systemPrompt = asstConf?.systemPromptFile;
      }
    }
    
    if (systemPrompt) {
      const systemPromptPath = path.join(__dirname, '..', '..', '..', 'prompts', systemPrompt);
      if (!fs.existsSync(systemPromptPath)) {
        return '';
      } else {
        return fs.readFileSync(systemPromptPath, 'utf-8');
      }
    }
}

function loadVectorId(assistantId) {
  let vectorId;
  if (assistantId) {
    const asstConf = asssistantMap.get(assistantId);

    vectorId = asstConf?.vectorStoreId;
  }

  return vectorId;
}

function loadProjectKey(assistantId) {
  let projectKey;
  if (assistantId) {
    const asstConf = asssistantMap.get(assistantId);

    projectKey = asstConf?.apiKey;
  }

  return projectKey;
}

async function doStreamChat(req, res) {
  try {
    let history = [];
    const { assistantId, sessionId, message } = req.body;
    const systemPromptIns = loadSystemPrompt(assistantId);
    const vectorStoreId = loadVectorId(assistantId);
    const projectApiKey = loadProjectKey(assistantId);

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const client = new OpenAI({ apiKey: projectApiKey });

    const clientConfig = {
        model: OPENAI_MODEL,
        instructions: systemPromptIns,
        input: [
            { role: 'system', content: 'Answer strictly from your system knowledge.' },
            ...history,
            { 
              role: 'user', 
              content: message,  
            }
        ],
        stream: true,
    };

    if (vectorStoreId) {
      clientConfig['tools'] = [{
          "type": "file_search",
          "vector_store_ids": [vectorStoreId]
      }];
    }

    const stream = await client.responses.create(clientConfig);

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
  doStreamChat,
};