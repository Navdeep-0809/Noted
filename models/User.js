// models/User.js
// ============================================================
// MONGOOSE SCHEMA - defines the structure of User documents
// in MongoDB. Think of it as a "blueprint" for user data.
// ============================================================

const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

// Define the User Schema
// mongoose.Schema() tells Mongoose what fields each User document should have
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,  // field is mandatory
      unique: true,    // no two users can have same username
      trim: true,      // removes extra whitespace
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    // timestamps: true → Mongoose automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// ============================================================
// PRE-SAVE HOOK (Mongoose Middleware)
// This runs automatically BEFORE saving a user to the database.
// We use it to hash the plain-text password with bcrypt.
// bcrypt adds a "salt" (random data) and hashes the password
// so it cannot be reversed - this is how we store passwords safely.
// ============================================================
userSchema.pre('save', async function () {
  // "this" refers to the current user document being saved
  if (!this.isModified('password')) return; // only hash if password changed

  // bcrypt.hash(password, saltRounds) - 10 salt rounds is a good default
  this.password = await bcrypt.hash(this.password, 10);
});

// ============================================================
// INSTANCE METHOD: comparePassword
// We add a custom method to compare login password with hashed one.
// bcrypt.compare() returns true if they match, false otherwise.
// ============================================================
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Export the model - mongoose.model('User', schema) creates a 'users' collection
module.exports = mongoose.model('User', userSchema);
