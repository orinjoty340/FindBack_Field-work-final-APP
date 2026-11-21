
const cloudinary = require('cloudinary').v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Safe diagnostic: never prints credential values
console.log('Cloudinary environment check:', {
  cloudNameSet: Boolean(cloudName),
  apiKeySet: Boolean(apiKey),
  apiSecretSet: Boolean(apiSecret),
});

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

module.exports = cloudinary;
