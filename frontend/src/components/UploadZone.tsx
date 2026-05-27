import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { extractQuota } from "../lib/quota";
import type { QuotaInfo } from "./UpgradeModal";

type Props = {
  vaultId: string;
  onUploaded?: () => void;
  onQuotaExceeded?: (quota: QuotaInfo) => void;
};

export const UploadZone = ({ vaultId, onUploaded, onQuotaExceeded }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        await api.post(`/vaults/${vaultId}/files`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      onUploaded?.();
    } catch (err: unknown) {
      const q = extractQuota(err);
      if (q && onQuotaExceeded) {
        onQuotaExceeded(q);
      } else {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setError(msg ?? "Error al subir archivos");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      animate={{
        borderColor: dragOver ? "#7e238b" : "#e5e5e0",
        backgroundColor: dragOver ? "rgba(126, 35, 139, 0.05)" : "transparent",
      }}
      transition={{ duration: 0.2 }}
      className="border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer hover:bg-warm-fog/40 transition"
      onClick={() => inputRef.current?.click()}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        upload(e.dataTransfer.files);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => upload(e.target.files)}
      />
      <div className="w-12 h-12 rounded-2xl bg-warm-light mx-auto mb-3 flex items-center justify-center">
        {uploading ? (
          <Loader2 className="text-warm-accent animate-spin" size={22} />
        ) : (
          <Upload className="text-warm-plum" size={22} />
        )}
      </div>
      <p className="text-sm font-semibold text-warm-plum mb-1">
        {uploading ? "Subiendo archivos..." : "Arrastra o haz click para subir"}
      </p>
      <p className="text-xs text-warm-silver">
        Fotos, audios, videos, textos — hasta 50 MB por archivo
      </p>
      {error && <p className="text-red-700 text-xs mt-3">{error}</p>}
    </motion.div>
  );
};
