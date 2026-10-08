import { describe, expect, it } from "vitest";
import { buildMermaidErrorNode } from "./mermaidError";

describe("buildMermaidErrorNode (COA-017)", () => {
  it("renders diagram source as text, never as markup", () => {
    const node = buildMermaidErrorNode('graph TD\n<img src=x onerror="window.__xss=1">');
    expect(node.querySelector("img")).toBeNull();
    expect(node.querySelector("pre")?.textContent).toContain("<img src=x");
    expect(node.className).toBe("mermaid-error");
  });
});
