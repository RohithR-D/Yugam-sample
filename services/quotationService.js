const Quotation = require('../lib/db/src/schema/sales.mongo').Quotation;

const getQuotations = async (filter) => {
  try {
    const quotations = await Quotation.find(filter);
    return quotations;
  } catch (error) {
    console.error('Error fetching quotations:', error);
    throw error;
  }
};

const createQuotation = async (data) => {
  try {
    const newQuotation = new Quotation(data);
    await newQuotation.save();
    return newQuotation;
  } catch (error) {
    console.error('Error creating quotation:', error);
    throw error;
  }
};

module.exports = {
  getQuotations,
  createQuotation,
};