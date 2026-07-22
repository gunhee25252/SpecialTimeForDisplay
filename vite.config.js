// @ts-nocheck
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
function printSavePlugin() {
    return {
        name: 'print-save-api',
        configureServer(server) {
            server.middlewares.use('/api/prints', async (req, res) => {
                if (req.method !== 'POST') {
                    res.statusCode = 405;
                    res.end('Method Not Allowed');
                    return;
                }
                try {
                    const chunks = [];
                    for await (const chunk of req) {
                        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                    }
                    const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                    const spec = payload.spec;
                    const imageMatch = payload.imageDataUrl?.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
                    if (!spec || !imageMatch || !Number.isInteger(spec.printId)) {
                        res.statusCode = 400;
                        res.end('Invalid print payload');
                        return;
                    }
                    const paddedId = String(spec.printId).padStart(3, '0');
                    const imageFile = `print-${paddedId}.png`;
                    const jsonFile = `print-${paddedId}.json`;
                    const outDir = path.resolve(process.cwd(), 'print-results');
                    await mkdir(outDir, { recursive: true });
                    await writeFile(path.join(outDir, imageFile), Buffer.from(imageMatch[1], 'base64'));
                    await writeFile(path.join(outDir, jsonFile), JSON.stringify({ ...spec, imageFile }, null, 2), 'utf8');
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ ok: true, imageFile, jsonFile }));
                }
                catch (error) {
                    server.config.logger.error(error instanceof Error ? error.message : String(error));
                    res.statusCode = 500;
                    res.end('Failed to save print files');
                }
            });
        },
    };
}
// Standalone kiosk build uses relative asset paths.
export default defineConfig({
    base: './',
    plugins: [react(), printSavePlugin()],
});
