/**
 * Finds the primary content region for skip-link focus and “read aloud” text extraction.
 */
export function getMainContentElement(): HTMLElement | null {
  const marked = document.querySelector<HTMLElement>("[data-app-content]");
  if (marked) {
    if (!marked.id) marked.id = "main-content";
    if (!marked.hasAttribute("tabindex")) marked.setAttribute("tabindex", "-1");
    return marked;
  }

  const byId = document.getElementById("main-content");
  if (byId) {
    if (!byId.hasAttribute("tabindex")) {
      byId.setAttribute("tabindex", "-1");
    }
    return byId;
  }

  const main = document.querySelector<HTMLElement>("main, [role='main']");
  if (main) {
    if (!main.id) main.id = "main-content";
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    return main;
  }

  const root = document.getElementById("root");
  if (!root) return null;

  for (const el of Array.from(root.children)) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.tagName === "A" && el.getAttribute("href") === "#main-content") continue;
    if (el.getAttribute("aria-label") === "Accessibility tools") continue;
    if (!el.id) el.id = "main-content";
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    return el;
  }

  return null;
}

export function getSpeakablePlainText(root: HTMLElement | null): string {
  if (!root) return "";
  const clone = root.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(
      "script, style, noscript, template, [aria-hidden='true'], [data-no-speak]",
    )
    .forEach((n) => n.remove());
  const text = clone.innerText ?? "";
  return text.replace(/\s+/g, " ").trim().slice(0, 32000);
}
