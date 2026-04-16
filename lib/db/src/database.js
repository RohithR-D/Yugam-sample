const mongoose = require('mongoose');
const connectMongoDB = require('./connectMongoDB');

const initializeDatabase = async () => {
  await connectMongoDB();
  console.log('Database layer refactored to use MongoDB.');
};

module.exports = initializeDatabase;