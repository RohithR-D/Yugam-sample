import { usersTable } from "@workspace/db/schema";

export const getUsers = async () => {
  return await usersTable.find().sort({ createdAt: -1 }).lean();
};

export const createUser = async (data: { name: string; email: string; role?: string; department?: string }) => {
  const user = await usersTable.create(data);
  return user.toObject();
};
