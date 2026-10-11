/**
 * Builds the "diagram syntax error" node without innerHTML so untrusted
 * diagram source can never be parsed as markup (COA-017).
 */
export function buildMermaidErrorNode(code: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "mermaid-error";
  const label = document.createElement("span");
  label.textContent = "⚠️ Diagram syntax error";
  const pre = document.createElement("pre");
  pre.textContent = `${code.slice(0, 100)}...`;
  wrapper.append(label, pre);
  return wrapper;
}
