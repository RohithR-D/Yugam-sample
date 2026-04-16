import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createEmployee, getEmployees } from "../services/crewService";
import { EmployeeFormData, EmployeeRecord } from "../types";

const INITIAL_FORM: EmployeeFormData = {
  name: "",
  designation: "",
  department: "",
  status: "Active",
  joinDate: "",
};

export function useCrew() {
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await createEmployee(formData);
      setShowModal(false);
      setFormData(INITIAL_FORM);
      await fetchEmployees();
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(
    () =>
      employees.filter(
        (emp) =>
          emp.name.toLowerCase().includes(search.toLowerCase()) ||
          emp.designation.toLowerCase().includes(search.toLowerCase()) ||
          emp.department.toLowerCase().includes(search.toLowerCase()),
      ),
    [employees, search],
  );

  const metrics = useMemo(() => {
    const totalCount = employees.length;
    const activeCount = employees.filter((e) => e.status === "Active").length;
    const onLeaveCount = employees.filter((e) => e.status === "On Leave").length;
    const offboardedCount = employees.filter((e) => e.status === "Offboarded").length;

    return { totalCount, activeCount, onLeaveCount, offboardedCount };
  }, [employees]);

  return {
    search,
    setSearch,
    employees,
    loading,
    showModal,
    setShowModal,
    formData,
    setFormData,
    submitting,
    error,
    filtered,
    metrics,
    handleSubmit,
  };
}
