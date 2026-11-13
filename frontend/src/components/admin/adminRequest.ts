export const REVALIDATE = { headers: { "Cache-Control": "no-cache" } };

export function imageForm(file: File): FormData {
  const form = new FormData();
  form.append("file", file);
  return form;
}
