/**
 * Cross-platform clipboard copy utility
 * Supports modern HTTPS clipboard API and legacy/mobile HTTP fallback
 */
export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  if (typeof window === "undefined") return false;

  // 1. Modern navigator.clipboard API (requires secure context HTTPS or localhost)
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      // Fallback to legacy textarea execCommand if permissions denied or blocked
    }
  }

  // 2. Legacy fallback using invisible textarea + document.execCommand('copy')
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    textArea.style.opacity = "0";
    textArea.setAttribute("readonly", "");
    document.body.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, text.length);
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Clipboard copy failed:", err);
    return false;
  }
};

