const fetch = require('node-fetch');

const HF_API_URL = 'https://api-inference.huggingface.co/models';
const HF_API_KEY = process.env.HF_API_KEY;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Call a HuggingFace inference endpoint with retry on 503.
 */
const callHuggingFace = async (model, payload, retries = 2) => {
  const url = `${HF_API_URL}/${model}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 503) {
        const body = await res.json().catch(() => ({}));
        const waitTime = (body.estimated_time || 20) * 1000;
        console.log(`HF model loading, waiting ${waitTime}ms (attempt ${attempt}/${retries})`);
        if (attempt < retries) {
          await sleep(Math.min(waitTime, 30000));
          continue;
        }
      }

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`HuggingFace API error ${res.status}: ${errBody}`);
      }

      return await res.json();
    } catch (error) {
      if (attempt === retries) throw error;
      await sleep(2000);
    }
  }
};

/**
 * Extract named entities (skills, org, etc.) from resume text.
 * Uses dslim/bert-base-NER
 */
const extractEntities = async (text) => {
  try {
    // Truncate to 512 tokens worth (~2000 chars) to stay within model limits
    const truncated = text.slice(0, 2000);
    const result = await callHuggingFace('dslim/bert-base-NER', { inputs: truncated });
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.warn('NER extraction failed:', error.message);
    return [];
  }
};

/**
 * Get sentence embeddings for cosine similarity scoring.
 * Uses sentence-transformers/all-MiniLM-L6-v2
 */
const getEmbeddings = async (texts) => {
  try {
    const result = await callHuggingFace(
      'sentence-transformers/all-MiniLM-L6-v2',
      { inputs: texts, options: { wait_for_model: true } }
    );
    return result;
  } catch (error) {
    console.warn('Embedding generation failed:', error.message);
    return null;
  }
};

/**
 * Compute cosine similarity between two vectors.
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
};

/**
 * Score a resume against a job description.
 * Returns 0–100.
 */
const scoreResumeAgainstJD = async (resumeText, jobDescription) => {
  try {
    const embeddings = await getEmbeddings([
      resumeText.slice(0, 512),
      jobDescription.slice(0, 512),
    ]);

    if (!embeddings || !Array.isArray(embeddings) || embeddings.length < 2) {
      return fallbackScore(resumeText, jobDescription);
    }

    const similarity = cosineSimilarity(embeddings[0], embeddings[1]);
    // Scale 0–1 similarity to 0–100 score, bias upward slightly
    return Math.min(100, Math.round(similarity * 120));
  } catch (error) {
    console.warn('Resume scoring failed, using fallback:', error.message);
    return fallbackScore(resumeText, jobDescription);
  }
};

/**
 * Keyword-overlap fallback scorer when HF API is unavailable.
 */
const fallbackScore = (resumeText, jobDescription) => {
  const normalize = (text) =>
    text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];

  const resumeWords = new Set(normalize(resumeText));
  const jdWords = normalize(jobDescription);

  if (jdWords.length === 0) return 50;

  let matches = 0;
  for (const word of jdWords) {
    if (resumeWords.has(word)) matches++;
  }

  const ratio = matches / jdWords.length;
  return Math.min(100, Math.round(ratio * 150));
};

/**
 * Extract skills from resume text using keyword patterns + NER.
 */
const extractSkillsFromResume = async (resumeText) => {
  const techKeywords = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php',
    'react', 'next.js', 'vue', 'angular', 'node.js', 'express', 'django', 'flask', 'spring',
    'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'firebase',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ci/cd',
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'nlp',
    'figma', 'sketch', 'photoshop', 'illustrator',
    'agile', 'scrum', 'jira', 'confluence', 'git', 'github',
  ];

  const lower = resumeText.toLowerCase();
  const found = techKeywords.filter((kw) => lower.includes(kw));

  // Also try NER for organizations/misc skill names
  try {
    const entities = await extractEntities(resumeText);
    const nerSkills = entities
      .filter((e) => ['MISC', 'ORG'].includes(e.entity_group))
      .map((e) => e.word.replace(/^##/, '').trim())
      .filter((w) => w.length > 2);
    return [...new Set([...found, ...nerSkills])];
  } catch {
    return [...new Set(found)];
  }
};

/**
 * Extract years of experience from resume text.
 */
const extractExperience = (resumeText) => {
  const patterns = [
    /(\d+)\+?\s*years?\s+of\s+experience/i,
    /(\d+)\+?\s*years?\s+experience/i,
    /experience\s+of\s+(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*yrs?\s+experience/i,
  ];

  for (const pattern of patterns) {
    const match = resumeText.match(pattern);
    if (match) return parseInt(match[1], 10);
  }
  return 0;
};

module.exports = {
  callHuggingFace,
  extractEntities,
  getEmbeddings,
  cosineSimilarity,
  scoreResumeAgainstJD,
  extractSkillsFromResume,
  extractExperience,
  fallbackScore,
};
