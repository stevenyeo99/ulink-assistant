const path = require('path');
const OpenAI = require('openai');
const fs = require('fs');
const Pdfkit = require('pdfkit');
const moment = require('moment');

const { OPENAI_MODEL } = require('../../config');
const { asssistantMap } = require('../assistant/assistant.controller');

const { fallbackTitle } = require('../../utils/text-util');
const { formatFileName } = require('../../utils/report-util');

const { findChat, addChat, getAllChats } = require('../../models/chats/chat.model');
const { addMessage, findMessageByChatId } = require('../../models/messages/message.model');


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
    const { userId, assistantId, sessionId, message } = req.body;
    const systemPromptIns = loadSystemPrompt(assistantId);
    const vectorStoreId = loadVectorId(assistantId);
    const projectApiKey = loadProjectKey(assistantId);

    let existingChat = await findChat({ sessionId });
    let history = [];
    if (!existingChat) {
      const title = fallbackTitle(message);
      existingChat = await addChat({
        title,
        userId,
        sessionId,
        assistantId,
      });
      
      history = await findMessageByChatId(existingChat?._id);
    }

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
    addMessage({
      chatId: existingChat?._id,
      role: 'user',
      content: message
    });
    
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
    addMessage({
      chatId: existingChat?._id.toString(),
      role: 'assistant',
      content: msg
    });

    // console.log(msg);
    return res.end();
  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
    res.end();
  }
}

async function doGetChatHistory(req, res) {
  const { userId, skip, limit } = req.query;

  if (!userId) {
    return res.status(400).json({
      message: 'Please provide valid userId'
    });
  }
  
  const chatHistories = await getAllChats({userId}, skip, limit);

  return res.status(200).json({
    data: chatHistories
  });
}

async function doGetChatMessages(req, res) {
  const { chatId } = req.params;

  if (!chatId) {
    return res.status(400).json({
      message: 'Please provide valid chatId'
    });
  }

  const chatMessages = await findMessageByChatId({chatId});

  return res.status(200).json({
    data: chatMessages
  });
}

async function doGenerateConversationHistoryReport(req, res) {
  const { chatId } = req.params;

  let existingChat = await findChat({ _id: chatId });
  if (!existingChat) {
    return res.status(400).json({ 
      message: 'No Chat History Found.'
    });
  }

  const chatMessages = await findMessageByChatId({chatId});

  if (chatMessages && chatMessages.length > 1) {
    try {
      const doc = new Pdfkit();

      const fileName = formatFileName(`${existingChat?.title}`);
      const file = path.join(__dirname, '..', '..', '..', 'reports', fileName);

      const stream = fs.createWriteStream(file);

      doc.pipe(stream);

      chatMessages.forEach(msg => {
        doc
          .font('Helvetica-Bold')
          .text(`(${moment(msg.createdAt).format('DD MMMM YYYY HH:mm A')}) - `, { continued: true })
          .font('Helvetica-Bold')
          .text(`${msg.role}:`, { continued: true })
          .font('Helvetica')
          .text(` ${msg.content}`)
          .moveDown(0.5);
      });

      doc.end();

      stream.on('finish', () => {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.pdf"`);
        res.setHeader('Cache-Control', 'no-store');
        return res.sendFile(file);
      });

      stream.on('error', (err) => {
        console.error('PDF write error:', err);
        res.status(500).json({ message: 'Error writing PDF' });
      });
    } catch (err) {
      return res.status(500).json({
        message: 'Error on system handling'
      })
    }
  }
}

module.exports = {
  doStreamChat,
  doGetChatHistory,
  doGetChatMessages,
  doGenerateConversationHistoryReport
};