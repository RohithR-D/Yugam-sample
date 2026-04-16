import bcrypt from "bcryptjs";
import { usersTable } from "@workspace/db/schema";
import { signToken } from "../../../shared/auth";

export const loginUser = async (email: string, password: string) => {
  const user = await usersTable.findOne({ email }).lean();
  if (!user || !user.passwordHash) {
    throw { statusCode: 401, message: "Invalid email or password" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw { statusCode: 401, message: "Invalid email or password" };
  }

  await usersTable.findOneAndUpdate({ id: user.id }, { lastLogin: new Date() });

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    department: user.department,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  };
};
