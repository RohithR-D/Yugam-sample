import mongoose from "mongoose";

export const runMongoTransaction = async <T>(
  work: (session: mongoose.ClientSession) => Promise<T>,
  options?: Record<string, unknown>,
): Promise<T> => {
  const session = await mongoose.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await work(session);
    }, options);
    return result!;
  } finally {
    await session.endSession();
  }
};
