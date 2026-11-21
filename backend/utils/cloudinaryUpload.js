
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'findback',
        resource_type: 'image',
        transformation: [
          {
            width: 1000,
            height: 1000,
            crop: 'limit',
          },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    Readable.from([buffer]).pipe(uploadStream);
  });
};

module.exports = uploadToCloudinary;
