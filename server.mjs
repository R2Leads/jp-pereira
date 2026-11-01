import { createServer } from "node:http";
import next from "next";

const port = process.env.PORT || "3000";
const hostname = process.env.HOSTNAME || "0.0.0.0";

const app = next({ dev: false });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer((request, response) => {
  handle(request, response);
});

const onListening = () => {
  console.log(`JP Pereira no ar em ${hostname}:${port}`);
};

if (/^\d+$/.test(String(port))) {
  server.listen(Number(port), hostname, onListening);
} else {
  server.listen(String(port), onListening);
}
