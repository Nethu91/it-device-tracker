const cloudinary = require("cloudinary").v2;

// ✅ .env file එකේ මේ 3 values තියෙන්න ඕනේ:
// CLOUDINARY_CLOUD_NAME=dayxsoufi
// CLOUDINARY_API_KEY=768693163986844
// CLOUDINARY_API_SECRET=your_secret_here

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;