import { insertQuoteSchema, quotesTable } from "@workspace/db/schema";

export const getQuotes = async () => {
  return await quotesTable.find().sort({ createdAt: -1 }).lean();
};

export const createQuote = async (data: any) => {
  const quote = await quotesTable.create(data);
  return quote.toObject();
};
