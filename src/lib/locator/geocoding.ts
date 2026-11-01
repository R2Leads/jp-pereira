import https from "node:https";
import { LocatorError, validCoordinates, STATES, type AddressSuggestion, type GeocodeResult, addressQuery } from "./domain.ts";
import { DEMO_POINTS } from "./demo-data.ts";

type Options = { apiKey: string; localDemo: boolean; fetcher?: typeof fetch };
type ReverseOptions = { apiKey: string; fetcher?: typeof fetch };
type AutocompleteOptions = { apiKey: string; fetcher?: typeof fetch };
type GeoRow = {
  lat?: number; lon?: number; country_code?: string; formatted?: string; result_type?: string;
  rank?: { confidence?: number };
  city?: string; town?: string; village?: string; municipality?: string;
  state?: string; state_code?: string; county?: string; county_code?: string;
  postcode?: string; address_line1?: string; address_line2?: string;
};
export type GeoPlace = { city: string | null; state: string | null };
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const stateCode = (value: unknown) => typeof value === "string" ? value.replace(/^BR[-_]/i, "").trim().toUpperCase() : "";
export function placeFromRow(row: GeoRow): GeoPlace {
  const city = [row.city, row.town, row.village, row.municipality]
    .find((value): value is string => typeof value === "string" && Boolean(value.trim()));
  // Em alguns resultados brasileiros o provedor manda a macrorregião em "state"
  // e a UF em "county"; por isso o código da UF também é lido de county_code.
  let code = stateCode(row.state_code);
  if (!STATES.includes(code)) {
    const countyCode = stateCode(row.county_code);
    if (STATES.includes(countyCode)) code = countyCode;
  }
  return {
    city: city ? city.trim().slice(0, 100) : null,
    state: STATES.includes(code) ? code : null,
  };
}

// Somente esta conexão usa IPv4; não altera DNS, agentes ou rede globais.
export function fetchGeoapify(url: URL, {signal}: RequestInit): Promise<{ok: boolean; json(): Promise<unknown>}> {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {family:4, signal:signal ?? undefined}, response => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk: string) => { body += chunk; });
      response.once("error", reject);
      response.once("end", () => resolve({
        ok: response.statusCode !== undefined && response.statusCode >= 200 && response.statusCode < 300,
        json: async () => JSON.parse(body) as unknown,
      }));
    });
    request.once("error", reject);
  });
}

export function createGeocoder(options: Options) {
  return async (query: string): Promise<GeocodeResult> => {
    if (!query.trim() || query.length > 400) throw new LocatorError("Informe um endereço ou CEP válido.");
    if (!options.apiKey) {
      const sample = options.localDemo ? DEMO_POINTS.find(point => [
        point.postalCode, addressQuery({ ...point, phone: "", whatsapp: "" }),
      ].some(value => normalize(value) === normalize(query))) : undefined;
      if (sample) return { latitude: sample.latitude, longitude: sample.longitude,
        label: `${sample.address}, ${sample.city} - ${sample.state} · endereço ilustrativo`,
        confidence: null, precision: "demo", source: "demo", city: sample.city, state: sample.state };
      throw new LocatorError("A busca livre por endereço está pendente de configuração. Nesta demonstração, use um dos endereços de exemplo ou sua localização.", 503, "GEOCODER_NOT_CONFIGURED");
    }
    // A abreviação s/n faz o provedor perder o logradouro em endereços brasileiros.
    const searchText = query.trim().replace(/\bs\s*\/\s*n\b/gi, "").replace(/,\s*(?=,)/g, "").trim();
    if (!searchText) throw new LocatorError("Informe um endereço ou CEP válido.");
    const url = new URL("https://api.geoapify.com/v1/geocode/search");
    url.searchParams.set("text", searchText);
    url.searchParams.set("filter", "countrycode:br");
    url.searchParams.set("lang", "pt");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "3");
    url.searchParams.set("apiKey", options.apiKey);
    if (/^\d{5}-?\d{3}$/.test(query.trim())) url.searchParams.set("type", "postcode");
    let rows: GeoRow[];
    try {
      const response = await (options.fetcher ?? fetchGeoapify)(url, { signal: AbortSignal.timeout(8000), cache: "no-store" });
      if (!response.ok) throw new Error("Provider unavailable");
      const body: unknown = await response.json();
      if (!body || typeof body !== "object" || !("results" in body) || !Array.isArray(body.results)) throw new Error("Invalid provider response");
      rows = body.results;
    } catch {
      throw new LocatorError("Não foi possível consultar o endereço agora. Tente novamente em instantes ou use sua localização.", 503, "GEOCODER_UNAVAILABLE");
    }
    const row = rows.find(item => item && item.country_code === "br" && validCoordinates(item.lat, item.lon) &&
      typeof item.rank?.confidence === "number" && item.rank.confidence >= 0.6 && typeof item.formatted === "string");
    if (!row) throw new LocatorError("Não encontramos esse endereço com segurança. Confira o CEP ou acrescente cidade e UF.", 422, "ADDRESS_NOT_FOUND");
    const place = placeFromRow(row);
    return { latitude: row.lat!, longitude: row.lon!, label: row.formatted!.slice(0,500),
      confidence: row.rank!.confidence!, precision: row.result_type ?? "unknown", source: "geoapify",
      ...(place.city ? { city: place.city } : {}), ...(place.state ? { state: place.state } : {}) };
  };
}
export function createAutocomplete(options: AutocompleteOptions) {
  return async (query: string): Promise<AddressSuggestion[]> => {
    const text = query.trim();
    if (text.length < 3 || text.length > 300) return [];
    if (!options.apiKey.trim()) throw new LocatorError("A busca por sugestões está pendente de configuração.", 503, "GEOCODER_NOT_CONFIGURED");
    const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
    url.searchParams.set("text", text);
    url.searchParams.set("filter", "countrycode:br");
    url.searchParams.set("lang", "pt");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "6");
    url.searchParams.set("apiKey", options.apiKey);
    let rows: GeoRow[];
    try {
      const response = await (options.fetcher ?? fetchGeoapify)(url, { signal: AbortSignal.timeout(8000), cache: "no-store" });
      if (!response.ok) throw new Error("Provider unavailable");
      const body: unknown = await response.json();
      if (!body || typeof body !== "object" || !("results" in body) || !Array.isArray(body.results)) throw new Error("Invalid provider response");
      rows = body.results;
    } catch {
      throw new LocatorError("Não foi possível carregar as sugestões agora. Você pode buscar pelo texto digitado ou usar o CEP.", 503, "GEOCODER_UNAVAILABLE");
    }
    const seen = new Set<string>();
    const suggestions: AddressSuggestion[] = [];
    for (const row of rows) {
      if (!row || row.country_code !== "br" || !validCoordinates(row.lat, row.lon) ||
        typeof row.formatted !== "string" || !row.formatted.trim()) continue;
      const place = placeFromRow(row);
      const key = `${normalize(row.formatted)}|${normalize(place.city ?? "")}|${place.state ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const digits = typeof row.postcode === "string" ? row.postcode.replace(/\D/g, "") : "";
      suggestions.push({
        label: row.formatted.trim().slice(0, 300),
        city: place.city, state: place.state,
        postalCode: digits.length === 8 ? digits : null,
        latitude: row.lat!, longitude: row.lon!,
        precision: row.result_type ?? null,
      });
      if (suggestions.length >= 5) break;
    }
    return suggestions;
  };
}
export function createReverseGeocoder(options: ReverseOptions) {
  return async (latitude: number, longitude: number): Promise<GeoPlace> => {
    if (!options.apiKey.trim()) throw new LocatorError("Configure o serviço de localização para identificar a cidade.", 503, "GEOCODER_NOT_CONFIGURED");
    if (!validCoordinates(latitude, longitude)) throw new LocatorError("Localização inválida.");
    const url = new URL("https://api.geoapify.com/v1/geocode/reverse");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("lang", "pt");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("apiKey", options.apiKey);
    let rows: GeoRow[];
    try {
      const response = await (options.fetcher ?? fetchGeoapify)(url, { signal: AbortSignal.timeout(8000), cache: "no-store" });
      if (!response.ok) throw new Error("Provider unavailable");
      const body: unknown = await response.json();
      if (!body || typeof body !== "object" || !("results" in body) || !Array.isArray(body.results)) throw new Error("Invalid provider response");
      rows = body.results;
    } catch {
      throw new LocatorError("Não foi possível identificar a cidade agora.", 503, "GEOCODER_UNAVAILABLE");
    }
    return placeFromRow(rows[0] ?? {});
  };
}
export const geocodeAddress = createGeocoder({
  apiKey: process.env.GEOAPIFY_API_KEY?.trim() ?? "",
  localDemo: process.env.DEMO_LOCAL_ONLY === "true",
});
export const reverseGeocode = createReverseGeocoder({
  apiKey: process.env.GEOAPIFY_API_KEY?.trim() ?? "",
});
export const autocompleteAddress = createAutocomplete({
  apiKey: process.env.GEOAPIFY_API_KEY?.trim() ?? "",
});


