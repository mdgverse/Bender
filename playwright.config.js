import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./e2e', timeout:30000, reporter:'list',
  use:{baseURL:'http://127.0.0.1:5173',headless:true,launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}},
  webServer:{command:'npm run dev -- --port 5173 --strictPort',url:'http://127.0.0.1:5173',reuseExistingServer:!process.env.CI,timeout:30000}
});
