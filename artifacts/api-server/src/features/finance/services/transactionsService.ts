import { transactionsTable } from "@workspace/db/schema";

export const getTransactions = async (page: number, limit: number) => {
  const offset = (page - 1) * limit;
  const totalCount = await transactionsTable.countDocuments();
  const data = await transactionsTable.find().sort({ date: -1 }).skip(offset).limit(limit).lean();
  return {
    data,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  };
};

export const createTransaction = async (data: any) => {
  const txn = await transactionsTable.create(data);
  return txn.toObject();
};
