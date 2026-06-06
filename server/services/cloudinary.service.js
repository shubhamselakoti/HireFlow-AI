const cloudinary = require('../config/cloudinary');

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer from Multer memoryStorage
 * @param {object} options - Cloudinary upload options
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      folder: 'hireflow',
      resource_type: 'auto',
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(defaultOptions, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    uploadStream.end(buffer);
  });
};

/**
 * Delete a file from Cloudinary by public_id.
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error.message);
    throw error;
  }
};

/**
 * Upload a resume PDF to Cloudinary.
 */
const uploadResume = async (buffer, candidateName) => {
  const sanitized = candidateName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return uploadToCloudinary(buffer, {
    folder: 'hireflow/resumes',
    resource_type: 'raw',
    public_id: `resume_${sanitized}_${Date.now()}`,
    format: 'pdf',
  });
};

/**
 * Upload an employee avatar image.
 */
const uploadAvatar = async (buffer, employeeCode) => {
  return uploadToCloudinary(buffer, {
    folder: 'hireflow/avatars',
    resource_type: 'image',
    public_id: `avatar_${employeeCode}_${Date.now()}`,
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  });
};

/**
 * Upload a video file (interview recording).
 */
const uploadVideo = async (buffer, interviewId) => {
  return uploadToCloudinary(buffer, {
    folder: 'hireflow/interviews',
    resource_type: 'video',
    public_id: `interview_${interviewId}_${Date.now()}`,
  });
};

/**
 * Upload a general document.
 */
const uploadDocument = async (buffer, fileName) => {
  const sanitized = fileName.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
  return uploadToCloudinary(buffer, {
    folder: 'hireflow/documents',
    resource_type: 'raw',
    public_id: `doc_${sanitized}_${Date.now()}`,
  });
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadResume,
  uploadAvatar,
  uploadVideo,
  uploadDocument,
};
