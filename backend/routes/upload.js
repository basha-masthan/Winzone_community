const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload image to Cloudinary
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { folder = 'winzone_arena' } = req.body;
    
    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      }
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
});

// Upload multiple images
router.post('/images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    const { folder = 'winzone_arena' } = req.body;
    const uploadPromises = [];
    const results = [];

    // Upload each image
    for (const file of req.files) {
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;

      const uploadPromise = cloudinary.uploader.upload(dataURI, {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      });

      uploadPromises.push(uploadPromise);
    }

    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises);

    // Process results
    uploadResults.forEach(result => {
      results.push({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      });
    });

    res.json({
      success: true,
      message: `${results.length} images uploaded successfully`,
      data: { images: results }
    });

  } catch (error) {
    console.error('Multiple images upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
});

// Delete image from Cloudinary
router.delete('/image/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to delete image',
        data: { result }
      });
    }

  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
});

// Get image info from Cloudinary
router.get('/image/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;

    // Get image info from Cloudinary
    const result = await cloudinary.api.resource(publicId);

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        createdAt: result.created_at,
        tags: result.tags || []
      }
    });

  } catch (error) {
    console.error('Get image info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching image info',
      error: error.message
    });
  }
});

// Transform image (resize, crop, etc.)
router.post('/image/:publicId/transform', async (req, res) => {
  try {
    const { publicId } = req.params;
    const { width, height, crop, gravity, quality, format } = req.body;

    // Build transformation options
    const transformation = [];
    
    if (width || height) {
      transformation.push({ width, height, crop: crop || 'fill' });
    }
    
    if (gravity) {
      transformation.push({ gravity });
    }
    
    if (quality) {
      transformation.push({ quality });
    }
    
    if (format) {
      transformation.push({ fetch_format: format });
    }

    // Generate transformed URL
    const transformedUrl = cloudinary.url(publicId, {
      transformation: transformation
    });

    res.json({
      success: true,
      data: {
        originalUrl: cloudinary.url(publicId),
        transformedUrl: transformedUrl,
        transformation: transformation
      }
    });

  } catch (error) {
    console.error('Image transform error:', error);
    res.status(500).json({
      success: false,
      message: 'Error transforming image',
      error: error.message
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }

  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed'
    });
  }

  next(error);
});

module.exports = router;
