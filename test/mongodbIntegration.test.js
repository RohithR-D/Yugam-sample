import mongoose from 'mongoose';
import { expect } from 'chai';
import { Quotation } from '../lib/db/src/schema/sales.mongo.mjs';

describe('MongoDB Integration', () => {
  before(async () => {
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/test';
    await mongoose.connect(mongoUrl, {
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority' },
    });
  });

  after(async () => {
    await mongoose.disconnect();
  });

  it('should connect to MongoDB and fetch quotations', async () => {
    const quotations = await Quotation.find();
    expect(quotations).to.be.an('array');
  });
});