import multer from 'multer';

// Configure multer for memory storage (we'll process and upload to S3)
const storage = multer.memoryStorage();

// File filter to only accept images
const imageFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const pdfFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    files: 500, // Maximum 500 files at once
  },
});

export const uploadPdf = multer({
  storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB max PDF size
    files: 1,
  },
});
