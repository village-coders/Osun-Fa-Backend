import { v2 as cloudinary } from 'cloudinary';

/**
 * Deletes a file from Cloudinary given its URL.
 * Extracts the public_id and determines the resource_type.
 * @param url The full Cloudinary URL of the file.
 */
export const deleteFromCloudinary = async (url: string | undefined): Promise<void> => {
    if (!url) return;

    try {
        // Cloudinary URL format:
        // https://res.cloudinary.com/<cloud_name>/<resource_type>/upload/v<version>/<public_id>.<extension>

        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) {
            console.error('[Cloudinary Utility] Invalid Cloudinary URL:', url);
            return;
        }

        // resource_type is usually the part before 'upload'
        const resourceType = parts[uploadIndex - 1] === 'raw' ? 'raw' : 'image';

        // public_id is everything after the version (v<numbers>) and before the extension
        // Example: .../v12345678/folder/subfolder/file.jpg
        const publicIdWithExtension = parts.slice(uploadIndex + 2).join('/');

        let publicId = publicIdWithExtension;
        if (resourceType === 'image') {
            // Remove the extension for images
            const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
            if (lastDotIndex !== -1) {
                publicId = publicIdWithExtension.substring(0, lastDotIndex);
            }
        }

        console.log(`[Cloudinary Utility] Deleting ${resourceType}: ${publicId}`);

        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log(`[Cloudinary Utility] Deletion result:`, result);
    } catch (error) {
        console.error('[Cloudinary Utility] Error deleting from Cloudinary:', error);
    }
};
