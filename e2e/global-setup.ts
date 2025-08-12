import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // You can add database seeding here if needed
  // For example, using your existing seed script:
  // await page.goto('http://localhost:3000/api/seed');

  await browser.close();
}

export default globalSetup;
