import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import {localAccount} from './server/local-account.js';

export default defineConfig({
  server: {fs: {deny:['.env','.env.*','**/.git/**','**/.local-data/**','**/server/**']}},
  plugins:[{
    name:'local-account',
    configureServer(server) {server.middlewares.use(localAccount(fileURLToPath(new URL('./.local-data',import.meta.url))));},
    configurePreviewServer(server) {server.middlewares.use(localAccount(fileURLToPath(new URL('./.local-data',import.meta.url))));},
  }],
});
