import { HealthCheckResponse } from "@workspace/api-zod";

export const getHealthStatus = () => {
  return HealthCheckResponse.parse({ status: "ok" });
};
