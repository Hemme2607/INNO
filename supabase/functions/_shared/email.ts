export function formatEmailBody(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n");
  const html = normalized.replace(/\n/g, "<br />");
  return `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #000000; line-height: 1.5;">${html}</div>`;
}
