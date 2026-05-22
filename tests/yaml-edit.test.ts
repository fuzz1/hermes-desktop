import { describe, expect, it } from "vitest";
import {
  findTopLevelKey,
  findYamlPath,
  setYamlScalarValue,
} from "../src/main/yaml-edit";

describe("yaml-edit scalar editor", () => {
  it("replaces a nested scalar without touching same-named keys elsewhere", () => {
    const input = `telegram:\n  service_tier: slow\nagent:\n  service_tier: fast # keep\n`;

    const result = setYamlScalarValue(input, "agent.service_tier", "normal");

    expect(result.changed).toBe(true);
    expect(result.content).toContain("telegram:\n  service_tier: slow");
    expect(result.content).toContain('agent:\n  service_tier: "normal" # keep');
  });

  it("appends only missing top-level scalar keys", () => {
    const result = setYamlScalarValue("model:\n  default: x\n", "timezone", "UTC");

    expect(result.changed).toBe(true);
    expect(result.content).toContain('timezone: "UTC"');
  });

  it("does not invent missing nested paths", () => {
    const result = setYamlScalarValue("model:\n  default: x\n", "agent.tier", "fast");

    expect(result.changed).toBe(false);
    expect(result.content).toBe("model:\n  default: x\n");
  });

  it("pins flat lookups to the top level", () => {
    const input = `model:\n  default: nested\ndefault: top\n`;

    expect(findTopLevelKey(input, "default")?.value).toBe("top");
    expect(findYamlPath(input, "model.default")?.value).toBe("nested");
  });
});
