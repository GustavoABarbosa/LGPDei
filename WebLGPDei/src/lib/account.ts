import { API_BASE, throwIfNotOk } from "@/lib/api";

export async function downloadAccountData(): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/me/export`, {
    credentials: "include",
  });
  await throwIfNotOk(response);

  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = "lgpdei-meus-dados.json";
  link.click();
  URL.revokeObjectURL(url);
}
