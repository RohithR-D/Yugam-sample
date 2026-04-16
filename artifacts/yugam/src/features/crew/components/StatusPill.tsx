interface StatusPillProps {
  status: string;
}

export default function StatusPill({ status }: StatusPillProps) {
  const styles: Record<string, string> = {
    Active: "bg-green-50 text-green-600",
    "On Leave": "bg-orange-50 text-orange-600",
    Offboarded: "bg-gray-100 text-gray-500",
  };

  return (
    <span className={`px-3 py-0.5 rounded-full text-[11px] font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
