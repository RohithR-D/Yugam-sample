import { expensesTable } from "@workspace/db/schema";

export const getExpenses = async () => {
  return await expensesTable.find().sort({ date: -1 }).lean();
};

export const createExpense = async (data: any) => {
  const expense = await expensesTable.create(data);
  return expense.toObject();
};
