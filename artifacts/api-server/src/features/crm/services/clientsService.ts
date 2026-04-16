import { clientsTable, clientActivitiesTable, contactsTable } from "@workspace/db/schema";

export const getClients = async (page: number, limit: number) => {
  const offset = (page - 1) * limit;
  const totalCount = await clientsTable.countDocuments();
  const clients = await clientsTable.find().sort({ createdAt: -1 }).skip(offset).limit(limit).lean();
  const clientIds = clients.map((c) => c.id);

  const contactsByClient: Record<number, any[]> = {};
  const activitiesByClient: Record<number, any[]> = {};

  if (clientIds.length > 0) {
    const contacts = await contactsTable.find({ clientId: { $in: clientIds } }).lean();
    for (const contact of contacts) {
      if (contact.clientId) {
        contactsByClient[contact.clientId] = contactsByClient[contact.clientId] || [];
        contactsByClient[contact.clientId].push(contact);
      }
    }

    const activities = await clientActivitiesTable
      .find({ clientId: { $in: clientIds } })
      .sort({ createdAt: -1 })
      .lean();

    for (const activity of activities) {
      activitiesByClient[activity.clientId] = activitiesByClient[activity.clientId] || [];
      activitiesByClient[activity.clientId].push(activity);
    }
  }

  const data = clients.map((client) => ({
    ...client,
    contacts: contactsByClient[client.id] || [],
    activities: activitiesByClient[client.id] || [],
  }));

  return {
    data,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  };
};

export const getClientById = async (id: number) => {
  const client = await clientsTable.findOne({ id }).lean();
  if (!client) return null;

  const contacts = await contactsTable.find({ clientId: id }).lean();
  const activities = await clientActivitiesTable.find({ clientId: id }).sort({ createdAt: -1 }).lean();
  return { ...client, contacts, activities };
};

export const createClient = async (data: any) => {
  const client = await clientsTable.create(data);
  return client.toObject();
};

export const updateClient = async (id: number, updates: Record<string, any>) => {
  return await clientsTable.findOneAndUpdate({ id }, updates, { new: true }).lean();
};
