export function assertDemoDatabase() {
  const url = new URL(process.env.DATABASE_URL ?? "http://invalid");
  if (!["localhost","127.0.0.1"].includes(url.hostname) || url.port !== "55439" ||
      url.pathname !== "/jppereira_locator_demo" || process.env.DEMO_LOCAL_ONLY !== "true") {
    throw new Error("Operação permitida apenas no banco local jppereira_locator_demo, porta 55439, com DEMO_LOCAL_ONLY=true.");
  }
}

