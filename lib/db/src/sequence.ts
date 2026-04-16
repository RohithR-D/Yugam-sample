import mongoose from "mongoose";

const sequenceSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    value: { type: Number, required: true, default: 0 },
  },
  { collection: "counters" },
);

const Sequence = mongoose.models.Sequence || mongoose.model("Sequence", sequenceSchema);

export const getNextSequence = async (name: string) => {
  const sequence = await Sequence.findByIdAndUpdate(
    name,
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  if (!sequence) {
    throw new Error(`Unable to get next sequence value for ${name}`);
  }

  return sequence.value;
};
