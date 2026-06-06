// ─── Department Routes ─────────────────────────────────────────────────────────
const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { isAdmin, isAdminOrRecruiter, isAdminManagerOrRecruiter } = require('../middleware/role.middleware');
const {
  getDepartments, createDepartment, updateDepartment,
  getJobs, getAllJobs, getJob, createJob, updateJob, deleteJob,
  getApplications, createApplication, updateApplicationStatus,
  getInterviews, getInterview, createInterview, submitInterview, updateInterview,
  getUsers, updateUserRole,
} = require('../controllers/core.controller');
const { getCandidates, bulkUpload, getCandidate, updateCandidate } = require('../controllers/candidate.controller');
const { getOnboardings, createOnboarding, updateTask } = require('../controllers/onboarding.controller');
const { uploadMultiple, uploadSingle } = require('../middleware/upload.middleware');

// ─── Department Router ─────────────────────────────────────────────────────────
const deptRouter = express.Router();
deptRouter.use(authMiddleware);
deptRouter.get('/', getDepartments);
deptRouter.post('/', isAdmin, createDepartment);
deptRouter.patch('/:id', isAdmin, updateDepartment);

// ─── Job Router ────────────────────────────────────────────────────────────────
const jobRouter = express.Router();
// Public: get open jobs (no auth needed)
jobRouter.get('/', getJobs);
jobRouter.get('/all', authMiddleware, getAllJobs);
jobRouter.use(authMiddleware);
jobRouter.get('/:id', getJob);
jobRouter.post('/', isAdminOrRecruiter, createJob);
jobRouter.patch('/:id', isAdminOrRecruiter, updateJob);
jobRouter.delete('/:id', isAdminOrRecruiter, deleteJob);

// ─── Candidate Router ──────────────────────────────────────────────────────────
const candidateRouter = express.Router();
candidateRouter.use(authMiddleware);
candidateRouter.get('/', isAdminOrRecruiter, getCandidates);
candidateRouter.post('/bulk-upload', isAdminOrRecruiter, uploadMultiple('resumes', 20), bulkUpload);
candidateRouter.get('/:id', getCandidate);
candidateRouter.patch('/:id', isAdminOrRecruiter, updateCandidate);

// ─── Application Router ────────────────────────────────────────────────────────
const applicationRouter = express.Router();
applicationRouter.use(authMiddleware);
applicationRouter.get('/', isAdminOrRecruiter, getApplications);
applicationRouter.post('/', createApplication);
applicationRouter.patch('/:id/status', isAdminOrRecruiter, updateApplicationStatus);

// ─── Interview Router ──────────────────────────────────────────────────────────
const interviewRouter = express.Router();
interviewRouter.use(authMiddleware);
interviewRouter.get('/', isAdminManagerOrRecruiter, getInterviews);
interviewRouter.post('/', isAdminOrRecruiter, createInterview);
interviewRouter.get('/:id', getInterview);
interviewRouter.post('/:id/submit', uploadSingle('video'), submitInterview);
interviewRouter.patch('/:id', isAdminOrRecruiter, updateInterview);

// ─── Onboarding Router ─────────────────────────────────────────────────────────
const onboardingRouter = express.Router();
onboardingRouter.use(authMiddleware);
onboardingRouter.get('/', getOnboardings);
onboardingRouter.post('/', isAdminOrRecruiter, createOnboarding);
onboardingRouter.patch('/:id/task', updateTask);

module.exports = {
  deptRouter,
  jobRouter,
  candidateRouter,
  applicationRouter,
  interviewRouter,
  onboardingRouter,
};
