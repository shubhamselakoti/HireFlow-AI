const { generateJobDescription, hrChatbot, evaluateVoiceAnswer, voiceAssistant } = require('../services/groq.service');
const { bulkScreenResumes, screenResume } = require('../services/ai.service');
const Employee = require('../models/Employee');
const Job = require('../models/Job');
const Leave = require('../models/Leave');

// POST /api/ai/generate-jd  (streaming SSE)
const generateJD = async (req, res) => {
  const { title, department, skills, experience, jobType, location } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Job title is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.flushHeaders();

  try {
    const stream = await generateJobDescription({ title, department, skills, experience, jobType, location });

    for await (const chunk of stream.body) {
      const text = chunk.toString();
      const lines = text.split('\n').filter((l) => l.startsWith('data: '));
      for (const line of lines) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
          return res.end();
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
        } catch { /* skip malformed */ }
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('JD generation error:', error.message);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
};

// POST /api/ai/chat
const chat = async (req, res) => {
  const { message, conversationHistory } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  const [totalEmployees, openJobs, pendingLeaves] = await Promise.all([
    Employee.countDocuments({ status: 'active' }),
    Job.countDocuments({ status: 'open' }),
    Leave.countDocuments({ status: 'pending' }),
  ]);

  const context = {
    totalEmployees,
    openJobs,
    pendingLeaves,
    userRole: req.user.role,
    userName: req.user.name,
  };

  const reply = await hrChatbot(message, context, conversationHistory || []);
  res.json({ success: true, data: { reply } });
};

// POST /api/ai/voice-chat
const voiceChat = async (req, res) => {
  const { text, mode, question, jobTitle } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, message: 'text is required' });
  }

  let result;
  if (mode === 'interview' && question) {
    result = await evaluateVoiceAnswer(question, text, jobTitle || '');
  } else {
    const reply = await voiceAssistant(text, { userRole: req.user.role });
    result = { reply };
  }

  res.json({ success: true, data: result });
};

// POST /api/ai/screen-resume
const screenSingleResume = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Resume PDF is required' });
  }
  const { jobId } = req.body;
  const result = await screenResume(req.file.buffer, req.file.originalname, jobId);
  res.json({ success: true, data: result });
};

module.exports = { generateJD, chat, voiceChat, screenSingleResume };
