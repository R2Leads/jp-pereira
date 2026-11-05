export const WHATSAPP_NUMBER = "551532171785";
export const WHATSAPP_DISPLAY = "(15) 3217-1785";

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
