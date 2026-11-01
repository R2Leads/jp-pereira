type HealthErrorCategory =
  | "authentication"
  | "dns"
  | "connection_refused"
  | "timeout"
  | "tls"
  | "missing_configuration"
  | "connection"
  | "other";

type HealthDiagnostic = {
  category: HealthErrorCategory;
  code?: string;
  syscall?: string;
};

type HealthCheck = () => Promise<unknown>;
type SafeLog = (line: string) => void;

const SAFE_CODES = new Map<string, HealthErrorCategory>([
  ["28P01", "authentication"],
  ["28000", "authentication"],
  ["ENOTFOUND", "dns"],
  ["EAI_AGAIN", "dns"],
  ["EAI_FAIL", "dns"],
  ["ENODATA", "dns"],
  ["ECONNREFUSED", "connection_refused"],
  ["ETIMEDOUT", "timeout"],
  ["ESOCKETTIMEDOUT", "timeout"],
  ["ERR_SSL_WRONG_VERSION_NUMBER", "tls"],
  ["ERR_SSL_UNSUPPORTED_PROTOCOL", "tls"],
  ["ERR_TLS_CERT_ALTNAME_INVALID", "tls"],
  ["ERR_TLS_HANDSHAKE_TIMEOUT", "tls"],
  ["CERT_HAS_EXPIRED", "tls"],
  ["CERT_NOT_YET_VALID", "tls"],
  ["DEPTH_ZERO_SELF_SIGNED_CERT", "tls"],
  ["SELF_SIGNED_CERT_IN_CHAIN", "tls"],
  ["UNABLE_TO_VERIFY_LEAF_SIGNATURE", "tls"],
  ["UNABLE_TO_GET_ISSUER_CERT_LOCALLY", "tls"],
  ["ECONNRESET", "connection"],
  ["ECONNABORTED", "connection"],
  ["EHOSTUNREACH", "connection"],
  ["ENETUNREACH", "connection"],
  ["08001", "connection"],
  ["08004", "connection"],
  ["08006", "connection"],
  ["57P01", "connection"],
  ["57P02", "connection"],
  ["57P03", "connection"],
]);

const SAFE_SYSCALLS = new Set(["connect", "getaddrinfo", "read", "write"]);
const LOG_PREFIX = "[api/health] PostgreSQL connection failed ";

function readField(record: Record<string, unknown>, field: string): unknown {
  try {
    return record[field];
  } catch {
    return undefined;
  }
}

function errorChain(error: unknown): Array<Record<string, unknown>> {
  const chain: Array<Record<string, unknown>> = [];
  const seen = new Set<object>();
  let current = error;

  for (let depth = 0; depth < 4; depth += 1) {
    if (typeof current !== "object" || current === null || seen.has(current)) break;
    seen.add(current);
    const record = current as Record<string, unknown>;
    chain.push(record);
    current = readField(record, "cause");
  }

  return chain;
}

function safeCode(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (SAFE_CODES.has(value) || /^[0-9A-Z]{5}$/.test(value)) return value;
  return /^ERR_(?:SSL|TLS)_[A-Z0-9_]{1,64}$/.test(value) ? value : undefined;
}

function categoryForCode(code: string): HealthErrorCategory | undefined {
  return (
    SAFE_CODES.get(code) ??
    (code.startsWith("28") ? "authentication" : undefined) ??
    (code.startsWith("08") ? "connection" : undefined) ??
    (/^ERR_(?:SSL|TLS)_/.test(code) ? "tls" : undefined)
  );
}

function safeSyscall(value: unknown): string | undefined {
  return typeof value === "string" && SAFE_SYSCALLS.has(value) ? value : undefined;
}

function diagnosticFor(error: unknown): HealthDiagnostic {
  const chain = errorChain(error);
  const codes = chain
    .map((entry) => safeCode(readField(entry, "code")))
    .filter((code): code is string => code !== undefined);
  const messages = chain
    .map((entry) => readField(entry, "message"))
    .filter((message): message is string => typeof message === "string");

  let category: HealthErrorCategory = "other";
  if (messages.some((message) => message === "DATABASE_URL is required")) {
    category = "missing_configuration";
  } else {
    const codeCategory = codes.map(categoryForCode).find(Boolean);
    if (codeCategory) {
      category = codeCategory;
    } else if (messages.some((message) => /\b(?:connect|connection) timeout\b|\btimeout expired\b/i.test(message))) {
      category = "timeout";
    }
  }

  const code = codes[0];
  const syscall = chain
    .map((entry) => safeSyscall(readField(entry, "syscall")))
    .find((value) => value !== undefined);

  return {
    category,
    ...(code ? { code } : {}),
    ...(syscall ? { syscall } : {}),
  };
}

export async function healthCheckResponse(
  check: HealthCheck,
  log: SafeLog = (line) => console.error(line),
): Promise<Response> {
  try {
    await check();
    return Response.json({ ok: true });
  } catch (error) {
    log(`${LOG_PREFIX}${JSON.stringify(diagnosticFor(error))}`);
    return Response.json({ ok: false }, { status: 500 });
  }
}

