import { useCallback, useEffect, useState } from "react";
import { getFiles } from "../services/driveService";
import type { FileRecord } from "../types";

export function useDriveFiles() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    try {
      setFiles(await getFiles());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return { files, loading, fetchFiles };
}
