// Document Management Routes
// Complete file management and document handling for legal practice

import { Router } from 'express';
import { DocumentService, createDocumentSchema, updateDocumentSchema, documentQuerySchema } from '../services/document.service';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Define allowed file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Apply authentication to all routes
router.use(authenticate);

// GET /api/v1/documents - List documents with pagination and filtering
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const query = documentQuerySchema.parse(req.query);
    const userId = req.user!.id;
    
    const result = await DocumentService.getDocuments(query, userId);
    
    res.json({
      success: true,
      data: result.documents,
      pagination: result.pagination,
      message: 'Documents retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /documents:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch documents'
    });
  }
});

// POST /api/v1/documents/upload - Upload new document
router.post('/upload', upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const documentData = createDocumentSchema.parse({
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      fileType: path.extname(req.file.originalname).substring(1).toUpperCase(),
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      filePath: req.file.path,
      isConfidential: req.body.isConfidential === 'true',
      version: parseInt(req.body.version || '1'),
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      clientId: req.body.clientId || undefined,
      contractId: req.body.contractId || undefined,
      matterId: req.body.matterId || undefined,
      disputeId: req.body.disputeId || undefined,
    });

    const userId = req.user!.id;
    const document = await DocumentService.createDocument(documentData, userId);
    
    res.status(201).json({
      success: true,
      data: document,
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('Error in POST /documents/upload:', error);
    
    // Clean up uploaded file if document creation failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup file:', cleanupError);
      }
    }
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload document'
      });
    }
  }
});

// GET /api/v1/documents/stats - Get document statistics
router.get('/stats', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const stats = await DocumentService.getDocumentStats(userId);
    
    res.json({
      success: true,
      data: stats,
      message: 'Document statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /documents/stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch document statistics'
    });
  }
});

// GET /api/v1/documents/search - Search documents
router.get('/search', async (req: AuthenticatedRequest, res) => {
  try {
    const { q, limit } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required'
      });
    }
    
    const userId = req.user!.id;
    const searchLimit = limit ? parseInt(limit as string) : 10;
    
    const documents = await DocumentService.searchDocuments(q, userId, searchLimit);
    
    res.json({
      success: true,
      data: documents,
      message: `Found ${documents.length} documents matching "${q}"`
    });
  } catch (error) {
    console.error('Error in GET /documents/search:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed'
    });
  }
});

// GET /api/v1/documents/:id - Get document by ID
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const document = await DocumentService.getDocumentById(id, userId);
    
    res.json({
      success: true,
      data: document,
      message: 'Document retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /documents/:id:', error);
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Document not found'
    });
  }
});

// GET /api/v1/documents/:id/download - Download document
router.get('/:id/download', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const downloadInfo = await DocumentService.downloadDocument(id, userId);
    
    res.setHeader('Content-Disposition', `attachment; filename="${downloadInfo.fileName}"`);
    res.setHeader('Content-Type', downloadInfo.mimeType);
    res.setHeader('Content-Length', downloadInfo.fileSize);
    
    res.sendFile(path.resolve(downloadInfo.filePath));
  } catch (error) {
    console.error('Error in GET /documents/:id/download:', error);
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Document not found'
    });
  }
});

// GET /api/v1/documents/:id/versions - Get document versions
router.get('/:id/versions', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const versions = await DocumentService.getDocumentVersions(id, userId);
    
    res.json({
      success: true,
      data: versions,
      message: 'Document versions retrieved successfully'
    });
  } catch (error) {
    console.error('Error in GET /documents/:id/versions:', error);
    res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Document not found'
    });
  }
});

// PUT /api/v1/documents/:id - Update document metadata
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const updateData = updateDocumentSchema.parse(req.body);
    const userId = req.user!.id;
    
    const document = await DocumentService.updateDocument(id, updateData, userId);
    
    res.json({
      success: true,
      data: document,
      message: 'Document updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /documents/:id:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update document'
      });
    }
  }
});

// DELETE /api/v1/documents/:id - Delete document
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const result = await DocumentService.deleteDocument(id, userId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error in DELETE /documents/:id:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete document'
    });
  }
});

export default router;
