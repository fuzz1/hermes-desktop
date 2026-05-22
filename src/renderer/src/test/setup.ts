import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.mock("electron", () => ({
  app: {
    getPath: () => "",
    getVersion: () => "0.0.0-test",
    isPackaged: false,
    on: vi.fn(),
    whenReady: () => Promise.resolve(),
  },
  BrowserWindow: vi.fn(),
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  shell: {
    openExternal: vi.fn(),
  },
  webUtils: {
    getPathForFile: vi.fn(() => ""),
  },
}));

afterEach(() => {
  cleanup();
});
