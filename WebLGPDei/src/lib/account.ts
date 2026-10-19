import { API_BASE, CSRF_HEADER, CSRF_HEADER_VALUE, throwIfNotOk } from "@/lib/api";

export async function downloadAccountData(): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/me/export`, {
    credentials: "include",
    headers: { [CSRF_HEADER]: CSRF_HEADER_VALUE },
  });
  await throwIfNotOk(response);

  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = "lgpdei-meus-dados.json";
  link.click();
  URL.revokeObjectURL(url);
}
