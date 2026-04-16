import { FC } from "react";

const styles: Record<string, string> = {
  Client: "bg-blue-50 text-blue-600",
  Vendor: "bg-purple-50 text-purple-600",
  Statutory: "bg-rose-50 text-rose-600",
  HR: "bg-teal-50 text-teal-600",
  Legal: "bg-indigo-50 text-indigo-600",
  General: "bg-gray-50 text-gray-600",
};

interface CategoryBadgeProps {
  category: string;
}

const CategoryBadge: FC<CategoryBadgeProps> = ({ category }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${styles[category] || "bg-gray-100 text-gray-600"}`}>
    {category}
  </span>
);

export default CategoryBadge;
