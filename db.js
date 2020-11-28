const mongoose = require('mongoose');

// await mongoose.connect(process.env.MONGO_URI,
// await mongoose.connect("mongodb+srv://linggo_api_user:s9W6lMnqR2@cluster0.47zkw.mongodb.net/test_db?retryWrites=true&w=majority",
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1); // Exit process with failure
  }
}

module.exports = connectDB;