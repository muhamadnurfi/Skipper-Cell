import multer from "multer";

// Upload manual ke Cloudinary via buffer.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 20000000, // 2 MB
  },
});

export default upload;
