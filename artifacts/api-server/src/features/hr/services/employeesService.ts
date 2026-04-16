import { employeesTable } from "@workspace/db/schema";

export const getEmployees = async () => {
  return await employeesTable.find().sort({ createdAt: -1 }).lean();
};

export const createEmployee = async (data: any) => {
  const employee = await employeesTable.create(data);
  return employee.toObject();
};
