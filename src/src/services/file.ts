import api from './axiosClient';

// Constants
export const S3_BASE_URL = "https://xacthucso.s3.ap-southeast-1.amazonaws.com/";
export const DEFAULT_IMAGE_URL = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";

export interface FileUploadResponse {
  file: {
    objectId: {
      id: string;
      url: string;
      presentation: string;
    };
  };
}

export interface FileUploadOptions {
  fileOwnerType: string;      // Type of the owner object (e.g., 'XTSProduct', 'XTSCounterparty')
  fileOwnerTypeId: string;    // ID of the owner object
  fileOwnerName: string;      // Name/presentation of the owner object
  fileType: string;           // Type of file being uploaded (e.g., 'Product', 'Counterparty')
  attributeName?: string;     // Name of the attribute to store the file (default: 'picture')
}

export interface FileDeleteOptions {
  fileId: string;
  fileType: string;          // Type of file being deleted (e.g., 'Product', 'Counterparty')
}

/**
 * Gets the complete URL for an image
 * @param imagePath The image path or URL
 * @returns The complete image URL
 */
export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return DEFAULT_IMAGE_URL;
  }

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Otherwise, construct the full S3 URL
  return `${S3_BASE_URL}${imagePath}`;
};

/**
 * Converts a File or Blob to base64 string
 */
const fileToBase64 = async (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Uploads a file to the server
 * @param file The file to upload
 * @param options Upload configuration options
 * @returns Promise with the upload response
 */
export const uploadFile = async (
  file: File,
  options: FileUploadOptions
): Promise<FileUploadResponse> => {
  // Validate file size (5MB limit)
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 5MB limit');
  }

  // Get file extension
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  
  // Validate file type
  const allowedTypes = ['jpg', 'jpeg', 'png'];
  if (!allowedTypes.includes(extension)) {
    throw new Error('Only JPG and PNG files are allowed');
  }

  try {
    // Convert file to base64
    const binaryData = await fileToBase64(file);

    // Construct the file type for attachment (e.g., XTSProductAttachedFile)
    const attachedFileType = `${options.fileOwnerType}AttachedFile`;

    const uploadData = {
      _type: 'XTSUploadFileRequest',
      _dbId: '',
      _msgId: '',
      file: {
        _type: attachedFileType,
        _isFullData: false,
        objectId: {
          _type: 'XTSObjectId',
          dataType: attachedFileType,
          id: '',
          presentation: '',
          url: ''
        },
        author: {
          _type: 'XTSObjectId',
          dataType: 'XTSUser',
          id: '',
          presentation: '',
          url: ''
        },
        fileOwner: {
          _type: 'XTSObjectId',
          dataType: options.fileOwnerType,
          id: options.fileOwnerTypeId,
          presentation: options.fileOwnerName,
          url: ''
        },
        description: '',
        creationDate: new Date().toISOString(),
        longDescription: '',
        size: Math.ceil(binaryData.length * 3/4), // Estimate size from base64
        extension: extension
      },
      binaryData: binaryData,
      startsWith: '',
      attributeName: options.attributeName || 'picture',
      copyToS3Storage: true
    };

    const response = await api.post('', uploadData);

    if (!response.data?.file?.objectId) {
      throw new Error('Invalid file upload response format');
    }

    return response.data;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Deletes a file from the server
 * @param options Delete configuration options
 * @returns Promise that resolves when deletion is complete
 */
export const deleteFile = async (options: FileDeleteOptions): Promise<void> => {
  try {
    // Construct the file type for attachment (e.g., XTSProductAttachedFile)
    const attachedFileType = `${options.fileType}AttachedFile`;

    const deleteData = {
      _type: 'XTSDeleteFilesRequest',
      _dbId: '',
      _msgId: '',
      fileIds: [
        {
          _type: 'XTSObjectId',
          dataType: attachedFileType,
          id: options.fileId,
          presentation: '',
          url: ''
        }
      ]
    };

    const response = await api.post('', deleteData);

    if (!response.data?.fileIds?.[0]) {
      throw new Error('Invalid file deletion response format');
    }

    // Verify the deleted file ID matches the requested file ID
    const deletedFileId = response.data.fileIds[0].id;
    if (deletedFileId !== options.fileId) {
      throw new Error('File deletion verification failed');
    }
  } catch (error) {
    console.error('File deletion error:', error);
    throw new Error('Failed to delete file');
  }
};