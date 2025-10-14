const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true, 
      trim: true, 
      lowercase: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    role: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const User = mongoose.model('User', UserSchema);

module.exports = User;