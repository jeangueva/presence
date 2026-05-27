import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { api } from "../lib/api";

type Props = {
  uploadUrl: string;
  currentUrl?: string | null;
  alt?: string;
  fallback?: string;
  size?: number;
  onUploaded?: (url: string) => void;
};

export const ProfilePhotoUploader = ({
  uploadUrl,
  currentUrl,
  alt = "Foto de perfil",
  fallback = "P",
  size = 80,
  onUploaded,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Solo imágenes");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const { data } = await api.post(uploadUrl, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded?.(data.profile_photo_url ?? "");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "No se pudo subir");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const dim = { width: size, height: size };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative rounded-full overflow-hidden group ring-1 ring-warm-sand hover:ring-warm-accent transition disabled:opacity-60"
        style={dim}
        aria-label="Cambiar foto de perfil"
      >
        {currentUrl ? (
          <img src={currentUrl} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-warm-accent/10 text-warm-accent font-bold flex items-center justify-center text-2xl">
            {fallback.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 bg-warm-plum/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          {uploading ? (
            <Loader2 size={20} className="text-white animate-spin" />
          ) : (
            <Camera size={20} className="text-white" />
          )}
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
};
