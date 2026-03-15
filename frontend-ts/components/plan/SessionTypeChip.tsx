"use client";

import Chip from "@mui/material/Chip";
import { SessionType } from "@/lib/types";

const sessionConfig: Record<SessionType, { color: "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info"; label: string }> = {
  Easy: { color: "success", label: "Easy" },
  Long: { color: "primary", label: "Long" },
  Interval: { color: "error", label: "Interval" },
  Fast: { color: "warning", label: "Fast" },
  Recovery: { color: "info", label: "Recovery" },
  Rest: { color: "default", label: "Rest" },
  Race: { color: "secondary", label: "Race" },
};

interface SessionTypeChipProps {
  type: SessionType;
  size?: "small" | "medium";
}

export default function SessionTypeChip({ type, size = "small" }: SessionTypeChipProps) {
  const config = sessionConfig[type] || { color: "default" as const, label: type };
  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      sx={{ fontWeight: 700, minWidth: 72 }}
    />
  );
}
