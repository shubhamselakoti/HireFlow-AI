const fetch = require('node-fetch');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

/**
 * Send a chat completion request to Groq.
 * @param {Array} messages - Array of {role, content} objects
 * @param {object} options - Additional options
 * @returns {Promise<string>} - Model response text
 */
const groqChat = async (messages, options = {}) => {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature || 0.7,
      messages,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
};

/**
 * Stream a chat completion from Groq (for JD generator).
 * Returns the raw Response for streaming to client.
 */
const groqChatStream = async (messages, options = {}) => {
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature || 0.7,
      messages,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq streaming error ${res.status}: ${err}`);
  }

  return res;
};

/**
 * Generate a job description for a given role.
 */
const generateJobDescription = async (params) => {
  const { title, department, skills = [], experience = 0, jobType = 'full_time', location = '' } = params;

  const messages = [
    {
      role: 'system',
      content: `You are an expert HR professional and technical recruiter. Generate complete, professional job descriptions that are engaging and detailed. Format your response in clean Markdown with proper headings.`,
    },
    {
      role: 'user',
      content: `Generate a complete professional job description for the following position:

Title: ${title}
Department: ${department || 'Not specified'}
Required Skills: ${skills.join(', ') || 'Not specified'}
Years of Experience Required: ${experience}+
Job Type: ${jobType.replace('_', ' ')}
Location: ${location || 'Remote/Hybrid'}

Please include:
1. **Role Summary** (2-3 sentences)
2. **Key Responsibilities** (8 bullet points)
3. **Required Skills & Qualifications**
4. **Nice to Have**
5. **What We Offer / Benefits**
6. **About the Role** (brief closing paragraph)

Make it engaging, specific, and professional.`,
    },
  ];

  return groqChatStream(messages, { maxTokens: 2048 });
};

/**
 * HR AI chatbot — responds to HR-related questions.
 */
const hrChatbot = async (userMessage, context = {}, conversationHistory = []) => {
  const systemPrompt = `You are HireFlow AI, an intelligent HR assistant embedded in the HireFlow HRMS platform.
You help HR teams, managers, and employees with HR-related questions, policy queries, and guidance.

Current context:
- Total employees: ${context.totalEmployees || 'Unknown'}
- Open jobs: ${context.openJobs || 'Unknown'}
- Pending leaves: ${context.pendingLeaves || 'Unknown'}
- Today's date: ${new Date().toDateString()}
- User role: ${context.userRole || 'employee'}
- User name: ${context.userName || 'User'}

Be helpful, concise, and friendly. Keep responses under 200 words unless detailed explanation is needed.
For sensitive HR matters, recommend consulting the HR team directly.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10), // keep last 10 messages for context
    { role: 'user', content: userMessage },
  ];

  return groqChat(messages, { maxTokens: 512, temperature: 0.6 });
};

/**
 * Evaluate a voice interview answer and return score + feedback.
 */
const evaluateVoiceAnswer = async (question, answer, jobTitle = '') => {
  const messages = [
    {
      role: 'system',
      content: `You are an expert interviewer evaluating candidate responses for a ${jobTitle} position.
Score the answer on a scale of 0-10 and provide brief constructive feedback.
Respond ONLY with valid JSON in this exact format: {"score": <number>, "feedback": "<string>"}`,
    },
    {
      role: 'user',
      content: `Interview Question: "${question}"\n\nCandidate Answer: "${answer}"\n\nEvaluate this answer.`,
    },
  ];

  try {
    const raw = await groqChat(messages, { maxTokens: 256, temperature: 0.3 });
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      score: Math.min(10, Math.max(0, Number(parsed.score) || 5)),
      feedback: parsed.feedback || 'Good response.',
    };
  } catch {
    return { score: 5, feedback: 'Answer received and evaluated.' };
  }
};

/**
 * Voice assistant — responds to spoken HR commands.
 */
const voiceAssistant = async (spokenText, context = {}) => {
  const messages = [
    {
      role: 'system',
      content: `You are HireFlow Voice Assistant. Respond conversationally and concisely (1-3 sentences max) to voice commands in an HRMS context.
User role: ${context.userRole || 'employee'}. Keep responses short enough to be spoken naturally.`,
    },
    { role: 'user', content: spokenText },
  ];

  return groqChat(messages, { maxTokens: 150, temperature: 0.5 });
};

module.exports = {
  groqChat,
  groqChatStream,
  generateJobDescription,
  hrChatbot,
  evaluateVoiceAnswer,
  voiceAssistant,
};
