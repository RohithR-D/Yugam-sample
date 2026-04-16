import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createPayrollRecord, getPayrollRecords } from "../services/crewPayService";
import { PayrollFormData, PayrollRecord } from "../types";
import { parseMoney } from "../utils/crewPayUtils";

const INITIAL_FORM: PayrollFormData = {
  employeeName: "",
  payPeriod: "March 2026",
  grossPay: "",
  deductions: "",
  status: "Processing",
};

export function useCrewPay() {
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<PayrollFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPayrollRecords();
      setRecords(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await createPayrollRecord(formData);
      setShowModal(false);
      setFormData(INITIAL_FORM);
      await fetchPayroll();
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(
    () =>
      records.filter(
        (r) =>
          r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
          r.payPeriod.toLowerCase().includes(search.toLowerCase()),
      ),
    [records, search],
  );

  const metrics = useMemo(() => {
    const totalGross = records.reduce((sum, r) => sum + parseMoney(r.grossPay), 0);
    const totalDeductions = records.reduce((sum, r) => sum + parseMoney(r.deductions), 0);
    const totalNet = records.reduce((sum, r) => sum + parseMoney(r.netPay), 0);
    const paidCount = records.filter((r) => r.status === "Paid").length;
    return { totalGross, totalDeductions, totalNet, paidCount };
  }, [records]);

  const computedNetPay = useMemo(
    () => parseMoney(formData.grossPay) - parseMoney(formData.deductions),
    [formData.deductions, formData.grossPay],
  );

  return {
    search,
    setSearch,
    records,
    loading,
    showModal,
    setShowModal,
    formData,
    setFormData,
    submitting,
    error,
    filtered,
    metrics,
    computedNetPay,
    handleSubmit,
  };
}
