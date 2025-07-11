const jwt = require('jsonwebtoken');

// Your payload
const payload = {
  userId: '4027518a-3d90-4c9c-8591-bb0f43203e74', // Replace with your userId
  role: 'CREATOR', // Or whatever role you want
  // iat and exp will be set automatically below
};

// Secret
const secret = 'Ishan';

// Set expiration to 7 days from now
const token = jwt.sign(
  payload,
  secret,
  {
    expiresIn: '7d' // or use '1h', '30m', etc.
  }
);

console.log('JWT Token:', token); 