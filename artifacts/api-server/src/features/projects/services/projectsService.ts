import { projectsTable } from "@workspace/db/schema";

export const getProjects = async () => {
  return await projectsTable.find().sort({ createdAt: -1 }).lean();
};

export const createProject = async (data: any) => {
  const project = await projectsTable.create(data);
  return project.toObject();
};
