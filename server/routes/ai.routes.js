const express = require('express');
const router = express.Router();
const { generateJD, chat, voiceChat, screenSingleResume } = require('../controllers/ai.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { isAdminOrRecruiter } = require('../middleware/role.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

// ── PUBLIC: interview answer scoring (no auth — called from interview room) ──
router.post('/score-answer', async (req, res) => {
  const { question, answer, jobTitle } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ success: false, message: 'question and answer are required' });
  }
  const { evaluateVoiceAnswer } = require('../services/groq.service');
  const result = await evaluateVoiceAnswer(question, answer, jobTitle || '');
  res.json({ success: true, data: result });
});

// ── Authenticated ─────────────────────────────────────────────────────────────
router.use(authMiddleware);
router.post('/generate-jd',   isAdminOrRecruiter, generateJD);
router.post('/chat',          chat);
router.post('/voice-chat',    voiceChat);
router.post('/screen-resume', isAdminOrRecruiter, uploadSingle('resume'), screenSingleResume);

module.exports = router;
