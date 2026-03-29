"use client";

import { Loader2, XCircle } from "lucide-react";

interface ToolCallPartProps {
  toolName: string;
  state: string;
  input: unknown;
}

export function getToolCallLabel(toolName: string, input: unknown): string {
  const args = input as Record<string, string> | null | undefined;
  const command = args?.command;
  const path = args?.path;

  if (toolName === "str_replace_editor" && path) {
    switch (command) {
      case "create":
        return `Creating ${path}`;
      case "str_replace":
      case "insert":
        return `Editing ${path}`;
      case "view":
        return `Reading ${path}`;
      case "undo_edit":
        return `Reverting ${path}`;
    }
  }

  if (toolName === "file_manager" && path) {
    switch (command) {
      case "rename": {
        const newPath = args?.new_path;
        return newPath ? `Renaming ${path} → ${newPath}` : `Renaming ${path}`;
      }
      case "delete":
        return `Deleting ${path}`;
    }
  }

  return toolName;
}

export function ToolCallPart({ toolName, state, input }: ToolCallPartProps) {
  const isDone = state === "output-available";
  const isError = state === "output-error" || state === "output-denied";
  const label = getToolCallLabel(toolName, input);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : isError ? (
        <XCircle className="w-3 h-3 text-red-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
