const express = require('express');
const router  = express.Router();
const fetch   = require('node-fetch');
const path    = require('path');

/**
 * GET /api/files/download?url=<cloudinary_url>&name=<filename>
 *
 * Proxies any Cloudinary file to the browser with Content-Disposition: attachment
 * so it forces a download rather than trying to open inline.
 *
 * No auth required — URL itself is the access token (Cloudinary signed or obscure).
 * Validates the URL is a Cloudinary domain to prevent SSRF.
 */
router.get('/download', async (req, res) => {
  const { url, name } = req.query;

  if (!url) {
    return res.status(400).json({ success: false, message: 'url parameter is required' });
  }

  // Security: only allow Cloudinary URLs
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid URL' });
  }

  if (!parsed.hostname.endsWith('cloudinary.com') && !parsed.hostname.endsWith('res.cloudinary.com')) {
    return res.status(403).json({ success: false, message: 'Only Cloudinary URLs are supported' });
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: 'File not found on Cloudinary' });
    }

    // Determine filename
    const urlPath  = parsed.pathname;
    const ext      = path.extname(urlPath) || '.pdf';
    const filename = name ? `${name}${ext}` : `download${ext}`;

    // Forward content-type from Cloudinary, default to pdf
    const contentType = response.headers.get('content-type') || 'application/pdf';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/"/g, '')}"`);

    const contentLength = response.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    // Stream directly to client
    response.body.pipe(res);
  } catch (err) {
    console.error('File proxy error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to download file' });
  }
});

/**
 * GET /api/files/view?url=<cloudinary_url>
 *
 * Same as download but serves inline (for PDF preview in browser).
 */
router.get('/view', async (req, res) => {
  const { url } = req.query;

  if (!url) return res.status(400).json({ success: false, message: 'url required' });

  let parsed;
  try { parsed = new URL(url); } catch {
    return res.status(400).json({ success: false, message: 'Invalid URL' });
  }

  if (!parsed.hostname.endsWith('cloudinary.com')) {
    return res.status(403).json({ success: false, message: 'Only Cloudinary URLs' });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).send('File not found');

    const contentType = response.headers.get('content-type') || 'application/pdf';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    const contentLength = response.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    response.body.pipe(res);
  } catch (err) {
    res.status(500).send('Failed to load file');
  }
});

module.exports = router;
