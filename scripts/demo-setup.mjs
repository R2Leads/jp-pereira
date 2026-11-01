import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const envPath = join(root, ".env.local");
if (existsSync(envPath)) {
  console.log("Configuração local existente preservada.");
  process.exit(0);
}
const dbPassword = randomBytes(24).toString("hex");
const password = randomBytes(18).toString("base64url");
const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
writeFileSync(envPath, [
  "DATABASE_URL=postgresql://jp_demo:" + dbPassword + "@127.0.0.1:55439/jppereira_locator_demo",
  "DEMO_DB_PASSWORD=" + dbPassword,
  "SESSION_SECRET=" + randomBytes(48).toString("hex"),
  "ADMIN_USERNAME=admin",
  "ADMIN_PASSWORD_HASH=scrypt:" + salt + ":" + hash,
  "GEOAPIFY_API_KEY=",
  "DEMO_LOCAL_ONLY=true",
  "APP_ORIGIN=http://localhost:3218",
  "",
].join("\n"));
mkdirSync(join(root, ".demo"), { recursive: true });
writeFileSync(join(root, ".demo", "access.json"), JSON.stringify({ username: "admin", password }));
writeFileSync(join(root, ".demo", "ACESSO-LOCAL.txt"),
  "Acesso exclusivo à demonstração local JP Pereira\n\nEndereço: http://localhost:3218/admin/pontos-de-venda\nUsuário: admin\nSenha: " + password +
  "\n\nCredencial gerada nesta máquina. Não compartilhe este arquivo.\n");
console.log("Configuração criada. A credencial está em .demo/ACESSO-LOCAL.txt; nenhum segredo foi impresso.");

