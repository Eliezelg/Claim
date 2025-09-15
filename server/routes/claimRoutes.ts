
import { Router } from "express";
import multer from 'multer';
import { isAuthenticated } from "../replitAuth";
import { ClaimController } from "../controllers/claimController";
import { DocumentController } from "../controllers/documentController";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  },
});

const router = Router();

// Claims
router.post('/', isAuthenticated, ClaimController.createClaim);
router.get('/', isAuthenticated, ClaimController.getUserClaims);
router.get('/:id', isAuthenticated, ClaimController.getClaimById);
router.patch('/:id/status', isAuthenticated, ClaimController.updateClaimStatus);

// Documents
router.post('/:id/documents', isAuthenticated, upload.single('file'), DocumentController.uploadDocument);
router.get('/:id/documents', isAuthenticated, DocumentController.getClaimDocuments);

export { router as claimRoutes };
