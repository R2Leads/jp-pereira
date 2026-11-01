export class LocatorError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 400, code = "INVALID_INPUT") {
    super(message);
    this.name = "LocatorError"; this.status = status; this.code = code;
  }
}
export type PointInput = {
  name: string; address: string; city: string; state: string;
  postalCode: string; phone: string; whatsapp: string;
};
export type GeocodeStatus = "needs_review" | "confirmed" | "error";
export type GeocodeResult = {
  latitude: number; longitude: number; label: string; confidence: number | null;
  precision: string; source: "geoapify" | "demo"; city?: string; state?: string;
};
export type AddressSuggestion = {
  label: string; city: string | null; state: string | null;
  postalCode: string | null; latitude: number; longitude: number;
  precision: string | null;
};
export const STATES = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

export function validatePointInput(input: unknown): PointInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new LocatorError("Cadastro inválido.");
  const raw = input as Record<string, unknown>;
  const text = (field: string, label: string, max: number, required = true) => {
    if (typeof raw[field] !== "string") {
      if (!required && raw[field] == null) return "";
      throw new LocatorError(`Informe ${label}.`);
    }
    const value = (raw[field] as string).trim();
    if ((required && !value) || value.length > max || /[\u0000-\u001f]/.test(value)) {
      throw new LocatorError(`Confira ${label} (até ${max} caracteres).`);
    }
    return value;
  };
  const state = text("state", "a UF", 2).toUpperCase();
  if (!STATES.includes(state)) throw new LocatorError("Escolha uma UF válida.");
  const postalCode = text("postalCode", "o CEP", 9);
  if (!/^\d{5}-?\d{3}$/.test(postalCode)) throw new LocatorError("Informe um CEP com oito números.");
  const phone = (field: string) => {
    const value = text(field, "o telefone", 30, false);
    if (!value) return "";
    const digits = value.replace(/\D/g, "");
    if (!/^[+\d\s().-]+$/.test(value) || ![10, 11, 12, 13].includes(digits.length)) throw new LocatorError("Confira o telefone ou WhatsApp, incluindo o DDD.");
    return digits;
  };
  return {
    name: text("name", "o nome", 160), address: text("address", "o endereço completo", 250),
    city: text("city", "a cidade", 100), state, postalCode: postalCode.replace("-", ""),
    phone: phone("phone"), whatsapp: phone("whatsapp"),
  };
}
export function validCoordinates(latitude: unknown, longitude: unknown): latitude is number {
  return typeof latitude === "number" && typeof longitude === "number" &&
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(lat2 - lat1), dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}
export function assertActivatable(point: {
  latitude: number | null; longitude: number | null; geocodeStatus: string; deletedAt: Date | string | null;
}) {
  if (point.deletedAt || point.geocodeStatus !== "confirmed" || !validCoordinates(point.latitude, point.longitude)) {
    throw new LocatorError("Confirme uma localização válida antes de ativar este ponto.", 409, "LOCATION_NOT_CONFIRMED");
  }
}
export function addressQuery(point: PointInput) {
  return `${point.address}, ${point.city}, ${point.state}, ${point.postalCode}, Brasil`;
}
export function mapsUrl(latitude: number, longitude: number, directions = true) {
  const url = new URL(directions ? "https://www.google.com/maps/dir/" : "https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set(directions ? "destination" : "query", `${latitude},${longitude}`);
  return url.toString();
}
// O Maps aceita o endereço escrito; não precisamos de coordenadas salvas.
export function addressMapsUrl(point: Pick<PointInput, "address" | "city" | "state" | "postalCode">) {
  const digits = point.postalCode.replace(/\D/g, "");
  const postalCode = digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", `${point.address}, ${point.city} - ${point.state}, ${postalCode}, Brasil`.replace(/\s+/g, " ").trim());
  return url.toString();
}
export function normalizePlaceName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}


