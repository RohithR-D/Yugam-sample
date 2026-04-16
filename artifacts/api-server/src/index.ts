import app from "./app";
import { logger } from "./shared/logger";
import { connectMongoDB } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const start = async () => {
  await connectMongoDB();
  app.listen(port, () => {
    logger.info({ port }, "Server listening");
  });
};

start().catch((error) => {
  logger.error({ error }, "Server failed to start");
  process.exit(1);
});
