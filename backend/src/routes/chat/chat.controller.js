const path = require('path');
const OpenAI = require('openai');
const fs = require('fs');
const Pdfkit = require('pdfkit');
const moment = require('moment');

const { OPENAI_MODEL } = require('../../config');
const { asssistantMap } = require('../assistant/assistant.controller');

const { fallbackTitle } = require('../../utils/text-util');
const { formatFileName } = require('../../utils/report-util');

const { findChat, addChat, getAllChats, saveChat } = require('../../models/chats/chat.model');
const { addMessage, findMessageByChatId } = require('../../models/messages/message.model');
const { getAsisstantKeyById } = require('../../models/assistants/assistant.model');


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
    vectorId = vectorId.split(',');
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

async function doCreateNewChat(chatConfig) {

  const { userId, assistantId, sessionId, title } = chatConfig;
  
  let existingChat = await findChat({ sessionId });
  if (!existingChat) {
    existingChat = await addChat({
      title,
      userId,
      sessionId,
      assistantId
    });
  }

  return existingChat;
}

async function doCallOpenAI(client, clientConfig) {
  return await client.responses.create(clientConfig);
}

async function doStreamChat(req, res) {
  try {
    const { userId, assistantId, sessionId, message } = req.body;
    const systemPromptIns = loadSystemPrompt(assistantId);
    const vectorStoreIds = loadVectorId(assistantId);
    const projectApiKey = loadProjectKey(assistantId);

    let existingChat = await doCreateNewChat({ userId, assistantId, sessionId });
    let history = await findMessageByChatId({ chatId: existingChat._id}, {createdAt: 0, chatId: 0, updatedAt: 0});

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

    if (vectorStoreIds) {
      clientConfig['tools'] = [{
          "type": "file_search",
          "vector_store_ids": vectorStoreIds
      }];
    }

    let stream = null;
    let isRetry = true;
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    while (isRetry) {
      try {
        stream = await doCallOpenAI(client, clientConfig);
        isRetry = false;
      } catch (err) {
        const is429 = err?.status === 429 || err?.code === 'rate_limit_exceeded';

        const resetHeader = err?.headers?.['x-ratelimit-reset-tokens'];
        const delay = resetHeader ? Number(resetHeader) * 1000 : 6000;

        console.log(`OpenAI token TPM need delay: ${delay}`);
        console.log(`${is429}, error code: ${err?.status}, ${err?.code}`);

        await sleep(delay);
      }
    }
    
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
  const { assistantId, userId } = req.query;

  if (!userId) {
    return res.status(400).json({
      message: 'Please provide valid userId'
    });
  }
  
  const chatHistories = await getAllChats({ userId, assistantId });

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
  const { sessionId } = req.params;

  let existingChat = await findChat({ sessionId });
  if (!existingChat) {
    return res.status(400).json({ 
      message: 'No Chat History Found.'
    });
  }

  const chatMessages = await findMessageByChatId({chatId: existingChat._id});
  const assistant = await getAsisstantKeyById(existingChat.assistantId);

  if (chatMessages && chatMessages.length > 1) {
    try {
      const doc = new Pdfkit({ size: "A4", margin: 48 });

      const fileName = formatFileName(`${existingChat?.title}`);
      const file = path.join(__dirname, '..', '..', '..', 'reports', fileName);

      const stream = fs.createWriteStream(file);

      doc.pipe(stream);

      const margin = 48;
      const pageW = doc.page.width;
      const pageH = doc.page.height;
      const maxW = pageW - margin * 2;

      doc.font("Helvetica-Bold").fontSize(16).text(`Chat with ${assistant?.displayName || "Assistant"}`, margin);
      doc.moveDown(0.6);
      doc.font("Helvetica").fontSize(11).text(`Started: ${moment(existingChat.createdAt).format('DD/MM/YYYY HH:MM')}`, margin);
      doc.moveDown(0.4);
      doc.moveTo(margin, doc.y).lineTo(pageW - margin, doc.y).strokeColor("#dddddd").stroke();
      doc.moveDown(0.6);

      doc.fontSize(12);
      for (const m of (chatMessages || [])) {
        doc.font('Helvetica-Bold').text(`(${moment(m.createdAt).format('DD/MM/YYYY HH:MM')}) - `, { continued: true });
        doc.font("Helvetica-Bold").text(m.role === "user" ? "User:" : "Assistant:", { width: maxW });
        doc.moveDown(0.2);
        doc.font("Helvetica").text(String(m.content ?? ""), { width: maxW });
        doc.moveDown(0.7);
        if (doc.y > pageH - margin) doc.addPage();
      }

      doc.moveDown(1);
      doc.fontSize(10).fillColor("#777777").text("Generated by Ulink Assist", margin, pageH - margin, { lineBreak: false });

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
      console.log(err);
      return res.status(500).json({
        message: 'Error on system handling'
      })
    }
  }
}

async function doUpdateChatTitle(req, res) {

  const { sessionId, title } = req.body;

  try {
    let existingChat = await findChat({ sessionId });
    
    if (!existingChat) {
      return res.status(400).json({
        message: 'Chat Session does not exist.'
      });
    }
    
    if (existingChat) {
      existingChat.title = title;

      await saveChat(existingChat);
    }

    return res.status(200).json({
      message: 'Succesfully Updated Chat Session Title',
      data: existingChat
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update chat title.'
    });
  }
}

module.exports = {
  doStreamChat,
  doGetChatHistory,
  doGetChatMessages,
  doGenerateConversationHistoryReport,
  doUpdateChatTitle,

  // util
  doCreateNewChat
};