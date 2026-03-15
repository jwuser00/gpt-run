"use client";

import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { PlanSessionBrief } from "@/lib/types";

interface ActivityUploadProps {
  uploading: boolean;
  onUpload: (file: File, planSessionId?: number | null) => void;
  planSessions?: PlanSessionBrief[];
}

export default function ActivityUpload({
  uploading,
  onUpload,
  planSessions = [],
}: ActivityUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | "">(
    "",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === e.currentTarget) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file, selectedSessionId || null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file, selectedSessionId || null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatSessionDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
      {planSessions.length > 0 && (
        <FormControl size="small" sx={{ maxWidth: 300 }}>
          <Select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value as number | "")}
            displayEmpty
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem value="">Free Run (계획 없음)</MenuItem>
            {planSessions.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {formatSessionDate(s.date)} - {s.session_type} - {s.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Box
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: 2,
          border: "2px dashed",
          borderColor: isDragging ? "primary.main" : "divider",
          borderRadius: 2,
          bgcolor: isDragging ? "action.hover" : "background.paper",
          cursor: "pointer",
          transition: "all 0.2s",
          "&:hover": {
            borderColor: "primary.main",
            bgcolor: "action.hover",
          },
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".tcx"
          hidden
          onChange={handleFileChange}
          disabled={uploading}
        />
        {uploading ? (
          <CircularProgress size={32} />
        ) : (
          <CloudUploadIcon sx={{ fontSize: 32, color: "primary.main" }} />
        )}
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            TCX 파일 업로드
          </Typography>
          <Typography variant="body2" color="text.secondary">
            여기를 클릭하거나 여기에 TCX 파일을 드래그앤 드롭 해 주세요.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
