import { randomBytes, scrypt } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const rl = createInterface({ input: stdin, output: stdout });

const password = (await rl.question("Senha do administrador (não será exibida nesta conversa): ")).trim();
rl.close();

if (password.length < 12) {
  console.error("Use uma senha com pelo menos 12 caracteres.");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = await new Promise((resolve, reject) => {
  scrypt(password, salt, 64, (error, derived) => (error ? reject(error) : resolve(derived)));
});

console.log("");
console.log("ADMIN_PASSWORD_HASH=" + `scrypt:${salt}:${hash.toString("hex")}`);
console.log("SESSION_SECRET=" + randomBytes(48).toString("base64url"));
console.log("");
console.log("Guarde esses valores no painel de variáveis da hospedagem. Não cole no chat.");
