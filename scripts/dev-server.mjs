import { watch } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPages } from './build-pages.mjs';

const projectDirectory = fileURLToPath(new URL('../', import.meta.url));
const outputDirectory = join(projectDirectory, '_site');
const port = Number(process.env.PORT ?? 5501);
const host = process.env.HOST ?? '0.0.0.0';
const watched = ['index.html', 'relay', 'assets', 'scripts'];
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2',
};

const reloadScript = "<script>new EventSource('/__reload').onmessage = () => location.reload();</script>";
const clients = new Set();
let building = Promise.resolve();
let timer;

function build() {
  building = building.then(async () => {
    try {
      await buildPages({ outputDirectory });
      console.log(`[${new Date().toLocaleTimeString()}] Build completed`);
      for (const client of clients) client.write('data: reload\n\n');
    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString()}] Build failed: ${error.message}`);
    }
  });
  return building;
}

await build();

for (const entry of watched) {
  watch(join(projectDirectory, entry), { recursive: true }, (_, file) => {
    if (file?.endsWith('.test.mjs')) return;
    clearTimeout(timer);
    timer = setTimeout(build, 100);
  });
}

createServer(async (request, response) => {
  if (request.url === '/__reload') {
    response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    response.write(': connected\n\n');
    clients.add(response);
    request.on('close', () => clients.delete(response));
    return;
  }
  try {
    let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = normalize(join(outputDirectory, pathname));
    if (file !== outputDirectory && !file.startsWith(outputDirectory + sep)) throw Object.assign(new Error(), { code: 'ENOENT' });
    if ((await stat(file)).isDirectory()) {
      response.writeHead(301, { Location: `${pathname}/` }).end();
      return;
    }
    await building;
    const type = extname(file).toLowerCase();
    let body = await readFile(file);
    if (type === '.html') body = body.toString('utf8').replace(/<\/body>/i, `${reloadScript}</body>`);
    response.writeHead(200, { 'Content-Type': types[type] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    const missing = error.code === 'ENOENT' || error.code === 'ENOTDIR' || error instanceof URIError;
    response.writeHead(missing ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' }).end(missing ? 'Not found' : 'Server error');
  }
}).listen(port, host, () => {
  console.log(`Serving _site at http://localhost:${port}/, watching ${watched.join(', ')}`);
  if (host === '0.0.0.0') {
    for (const address of Object.values(networkInterfaces()).flat()) {
      if (address.family === 'IPv4' && !address.internal) console.log(`  Network: http://${address.address}:${port}/`);
    }
  }
});
