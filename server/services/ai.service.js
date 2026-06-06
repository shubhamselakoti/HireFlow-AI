const pdfParse = require('pdf-parse');
const { scoreResumeAgainstJD, extractSkillsFromResume, extractExperience } = require('./huggingface.service');
const { uploadResume } = require('./cloudinary.service');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const Job = require('../models/Job');

/**
 * Screen a single resume PDF buffer against a job.
 * @param {Buffer} buffer - PDF file buffer
 * @param {string} fileName - Original filename
 * @param {string} jobId - Job ObjectId
 * @returns {Promise<{candidate, application, aiScore}>}
 */
const screenResume = async (buffer, fileName, jobId) => {
  // 1. Extract text from PDF
  let resumeText = '';
  try {
    const parsed = await pdfParse(buffer);
    resumeText = parsed.text || '';
  } catch (err) {
    console.warn(`PDF parse failed for ${fileName}:`, err.message);
    resumeText = '';
  }

  // 2. Fetch job description
  const job = await Job.findById(jobId).lean();
  const jobDescription = job
    ? `${job.title}\n${job.description}\nRequired skills: ${job.skills?.join(', ')}`
    : '';

  // 3. Extract candidate info from resume text
  const skills = await extractSkillsFromResume(resumeText);
  const yearsExperience = extractExperience(resumeText);
  const candidateName = extractNameFromFileName(fileName);
  const candidateEmail = extractEmailFromText(resumeText) || generateTempEmail(fileName);

  // 4. Score resume against JD
  const aiScore = await scoreResumeAgainstJD(resumeText, jobDescription);

  // 5. Upload resume PDF to Cloudinary
  let resumeUrl = null;
  try {
    const cloudResult = await uploadResume(buffer, candidateName);
    resumeUrl = cloudResult.secure_url;
  } catch (err) {
    console.warn('Resume upload failed:', err.message);
  }

  // 6. Upsert Candidate
  let candidate = await Candidate.findOne({ email: candidateEmail });
  if (candidate) {
    candidate.resumeText = resumeText;
    candidate.resumeUrl = resumeUrl || candidate.resumeUrl;
    candidate.skills = skills.length > 0 ? skills : candidate.skills;
    candidate.yearsExperience = yearsExperience || candidate.yearsExperience;
    candidate.aiScore = aiScore;
    await candidate.save();
  } else {
    candidate = await Candidate.create({
      name: candidateName,
      email: candidateEmail,
      resumeUrl,
      resumeText,
      skills,
      yearsExperience,
      aiScore,
    });
  }

  // 7. Create Application if jobId is provided
  let application = null;
  if (jobId) {
    application = await Application.findOneAndUpdate(
      { candidateId: candidate._id, jobId },
      {
        $setOnInsert: { candidateId: candidate._id, jobId },
        $set: { aiScore, status: 'screened' },
      },
      { upsert: true, new: true }
    );
  }

  return { candidate, application, aiScore };
};

/**
 * Screen multiple resumes in parallel (up to 20).
 */
const bulkScreenResumes = async (files, jobId) => {
  const results = await Promise.allSettled(
    files.map((file) => screenResume(file.buffer, file.originalname, jobId))
  );

  const successful = [];
  const failed = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successful.push(result.value);
    } else {
      failed.push({ file: files[index].originalname, error: result.reason?.message });
    }
  });

  // Sort by aiScore descending
  successful.sort((a, b) => b.aiScore - a.aiScore);

  return { successful, failed };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const extractNameFromFileName = (fileName) => {
  return fileName
    .replace(/\.(pdf|docx|doc)$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/resume|cv/i, '')
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || 'Unknown Candidate';
};

const extractEmailFromText = (text) => {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : null;
};

const generateTempEmail = (fileName) => {
  const base = fileName.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 20);
  return `${base}_${Date.now()}@hireflow.temp`;
};

module.exports = { screenResume, bulkScreenResumes };
