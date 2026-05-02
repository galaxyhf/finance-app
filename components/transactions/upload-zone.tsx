"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  onUploaded: () => void;
};

export function UploadZone({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(file?: File) {
    if (!file) {
      return;
    }

    setLoading(true);
    setMessage("Processando extrato...");
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const payload = await response.json();
    setMessage(response.ok ? `${payload.inserted} transações importadas` : payload.error);
    setLoading(false);
    onUploaded();
  }

  return (
    <div
      className={cn(
        "flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/35 p-5 text-center transition-colors",
        dragging && "border-primary bg-primary/10"
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void upload(event.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        className="hidden"
        accept=".csv,.xlsx,.xls,.ofx"
        type="file"
        onChange={(event) => void upload(event.target.files?.[0])}
      />
      {loading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <FileUp className="h-6 w-6 text-primary" />}
      <div className="text-sm font-medium">CSV, OFX ou XLSX</div>
      <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={loading}>
        Selecionar arquivo
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
