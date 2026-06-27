import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const testMongo = async () => {
  try {
    console.log('Connecting to:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 2000, 
      family: 4
    });
    console.log('MongoDB connection successful!');
    process.exit(0);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message || err);
    process.exit(1);
  }
};

testMongo();
