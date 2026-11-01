import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

function run(command, args) {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Node ${process.version} em ${process.cwd()}`);

run("npm", ["install", "--include=dev", "--no-audit", "--no-fund"]);

const nextBin = "node_modules/next/dist/bin/next";
if (!existsSync(nextBin)) {
  console.error("Next.js não encontrado após a instalação.");
  process.exit(1);
}

run(process.execPath, [nextBin, "build", "--webpack"]);
console.log("\nBuild de produção concluído.");

