import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

// Static Web Apps needs real files for each known route. Without these, an SPA
// navigation fallback turns every unknown path into HTTP 200 instead of 404.
function staticRoutes(): Plugin {
  return {
    name: 'voice-comfort-meter-static-routes',
    async closeBundle() {
      const outDir = join(process.cwd(), 'dist');
      const index = await readFile(join(outDir, 'index.html'), 'utf8');
      const routeMeta = {
        demo: { title: 'Demo — Voice Comfort Meter', canonical: 'https://voice-comfort-meter.sociobot.in/demo/' },
        privacy: { title: 'Privacy — Voice Comfort Meter', canonical: 'https://voice-comfort-meter.sociobot.in/privacy/' },
        terms: { title: 'Terms — Voice Comfort Meter', canonical: 'https://voice-comfort-meter.sociobot.in/terms/' }
      } as const;
      for (const route of Object.keys(routeMeta) as Array<keyof typeof routeMeta>) {
        const folder = join(outDir, route);
        await mkdir(folder, { recursive: true });
        const meta = routeMeta[route];
        await writeFile(join(folder, 'index.html'), index
          .replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`)
          .replace(/<link rel="canonical" href="[^"]+"\s*\/>/, `<link rel="canonical" href="${meta.canonical}" />`));
      }
      // Static Web Apps rewrites genuine misses to this document while keeping
      // the original URL. The client then renders its designed not-found page.
      await writeFile(join(outDir, '404.html'), index
        .replace(/<title>.*?<\/title>/, '<title>Not found — Voice Comfort Meter</title>')
        .replace(/<link rel="canonical" href="[^"]+"\s*\/>/, '<link rel="canonical" href="https://voice-comfort-meter.sociobot.in/404/" />'));

      const assets = (await readdir(join(outDir, 'assets'))).sort();
      const buildId = createHash('sha256').update(assets.join('|')).digest('hex').slice(0, 12);
      const shell = [
        '/', '/index.html', '/demo/', '/privacy/', '/terms/', '/404.html',
        '/offline.html', '/manifest.webmanifest', '/icon.svg',
        '/art/blueprint-hero.webp', ...assets.map((asset: string) => `/assets/${asset}`)
      ];
      const template = await readFile(join(outDir, 'sw.js'), 'utf8');
      await writeFile(join(outDir, 'sw.js'), template
        .replace('__BUILD_ID__', buildId)
        .replace('__SHELL__', JSON.stringify(shell)));
      const manifestPath = join(outDir, 'manifest.webmanifest');
      const manifest = await readFile(manifestPath, 'utf8');
      await writeFile(manifestPath, manifest.replace('__BUILD_ID__', buildId));
    }
  };
}

export default defineConfig({
  plugins: [staticRoutes()],
  build: {
    target: 'es2022', outDir: 'dist', sourcemap: false, modulePreload: false,
    rollupOptions: { output: {
      entryFileNames: 'assets/app-[hash].js',
      assetFileNames: asset => asset.name?.endsWith('.css') ? 'assets/app-[hash].css' : 'assets/[name]-[hash][extname]'
    } }
  },
  server: { host: '0.0.0.0' }
});
