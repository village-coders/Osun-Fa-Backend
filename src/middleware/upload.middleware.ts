import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

// Configure storage for different types of uploads
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        console.log("MWUPLOAD: Processing file:", file.fieldname, file.originalname);
        let folderInfo = 'osun-fa/misc';
        let resourceType = 'auto'; // 'auto', 'image', 'video', 'raw'

        if (file.mimetype.startsWith('image/')) {
            folderInfo = 'osun-fa/images';
        } else if (file.mimetype === 'application/pdf') {
            folderInfo = 'osun-fa/documents';
            resourceType = 'raw'; // PDFs usually need raw or auto
        }

        return {
            folder: folderInfo,
            resource_type: resourceType,
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf', 'doc', 'docx'],
        };
    },
});

export const upload = multer({ storage: storage });
