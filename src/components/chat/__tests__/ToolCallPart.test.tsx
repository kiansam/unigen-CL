import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallPart, getToolCallLabel } from "../ToolCallPart";

afterEach(() => {
  cleanup();
});

// --- getToolCallLabel unit tests ---

test("getToolCallLabel: str_replace_editor create", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "create", path: "/App.jsx" })).toBe("Creating /App.jsx");
});

test("getToolCallLabel: str_replace_editor str_replace", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "str_replace", path: "/components/Card.jsx" })).toBe("Editing /components/Card.jsx");
});

test("getToolCallLabel: str_replace_editor insert", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "insert", path: "/App.jsx" })).toBe("Editing /App.jsx");
});

test("getToolCallLabel: str_replace_editor view", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "view", path: "/App.jsx" })).toBe("Reading /App.jsx");
});

test("getToolCallLabel: str_replace_editor undo_edit", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })).toBe("Reverting /App.jsx");
});

test("getToolCallLabel: file_manager rename", () => {
  expect(getToolCallLabel("file_manager", { command: "rename", path: "/old.jsx" })).toBe("Renaming /old.jsx");
});

test("getToolCallLabel: file_manager rename with new_path", () => {
  expect(getToolCallLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" })).toBe("Renaming /old.jsx → /new.jsx");
});

test("getToolCallLabel: file_manager delete", () => {
  expect(getToolCallLabel("file_manager", { command: "delete", path: "/old.jsx" })).toBe("Deleting /old.jsx");
});

test("getToolCallLabel: unknown tool falls back to toolName", () => {
  expect(getToolCallLabel("some_other_tool", { command: "foo", path: "/x" })).toBe("some_other_tool");
});

test("getToolCallLabel: str_replace_editor without path falls back to toolName", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "create" })).toBe("str_replace_editor");
});

test("getToolCallLabel: null input falls back to toolName", () => {
  expect(getToolCallLabel("str_replace_editor", null)).toBe("str_replace_editor");
});

// --- ToolCallPart render tests ---

test("ToolCallPart shows label for create command", () => {
  render(
    <ToolCallPart
      toolName="str_replace_editor"
      state="output-available"
      input={{ command: "create", path: "/App.jsx" }}
    />
  );
  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
});

test("ToolCallPart shows label for str_replace command", () => {
  render(
    <ToolCallPart
      toolName="str_replace_editor"
      state="output-available"
      input={{ command: "str_replace", path: "/components/Card.jsx" }}
    />
  );
  expect(screen.getByText("Editing /components/Card.jsx")).toBeDefined();
});

test("ToolCallPart shows green dot when done", () => {
  const { container } = render(
    <ToolCallPart
      toolName="str_replace_editor"
      state="output-available"
      input={{ command: "create", path: "/App.jsx" }}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolCallPart shows spinner when not done", () => {
  const { container } = render(
    <ToolCallPart
      toolName="str_replace_editor"
      state="input-available"
      input={{ command: "create", path: "/App.jsx" }}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallPart shows spinner while streaming", () => {
  const { container } = render(
    <ToolCallPart
      toolName="str_replace_editor"
      state="input-streaming"
      input={{ command: "create", path: "/App.jsx" }}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("ToolCallPart falls back to toolName for unknown tool", () => {
  render(
    <ToolCallPart
      toolName="unknown_tool"
      state="output-available"
      input={null}
    />
  );
  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("ToolCallPart: file_manager delete shows Deleting label", () => {
  render(
    <ToolCallPart
      toolName="file_manager"
      state="input-available"
      input={{ command: "delete", path: "/old/file.jsx" }}
    />
  );
  expect(screen.getByText("Deleting /old/file.jsx")).toBeDefined();
});

test("ToolCallPart: rename with new_path shows arrow label", () => {
  render(
    <ToolCallPart
      toolName="file_manager"
      state="output-available"
      input={{ command: "rename", path: "/old.jsx", new_path: "/new.jsx" }}
    />
  );
  expect(screen.getByText("Renaming /old.jsx → /new.jsx")).toBeDefined();
});

test("ToolCallPart shows red icon when output-error", () => {
  const { container } = render(
    <ToolCallPart
      toolName="str_replace_editor"
      state="output-error"
      input={{ command: "create", path: "/App.jsx" }}
    />
  );
  expect(container.querySelector(".text-red-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallPart shows red icon when output-denied", () => {
  const { container } = render(
    <ToolCallPart
      toolName="str_replace_editor"
      state="output-denied"
      input={{ command: "create", path: "/App.jsx" }}
    />
  );
  expect(container.querySelector(".text-red-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});
