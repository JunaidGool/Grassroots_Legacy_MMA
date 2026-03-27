"use client";

import { useContext } from "react";
import { ToastContext } from "@/components/providers/ToastProvider";

export function useToast() {
  return useContext(ToastContext);
}
