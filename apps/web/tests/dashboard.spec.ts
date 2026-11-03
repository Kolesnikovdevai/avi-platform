import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("demo stays marked, periods change consistently and layout fits", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Обзор аналитики." })).toBeVisible();
  await expect(page.getByText("Все цифры вымышлены. Аккаунты Авито не подключены.")).toBeVisible();
  await expect(page.getByText("12 000 ₽", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Отчётный период" }).selectOption("month");
  await expect(page.getByText("48 000 ₽", { exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "30 000 ₽", exact: true })).toBeVisible();
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(fits).toBe(true);
});

test("navigation and unsupported actions explain their state without requests", async ({
  page,
  isMobile,
}) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1")) external.push(request.url());
  });
  await page.goto("/");
  if (isMobile) await page.getByRole("button", { name: "Открыть меню" }).click();
  await page.getByRole("button", { name: "Уведомления", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Важное придёт вовремя" })).toBeVisible();
  await page.getByRole("button", { name: "Как будет работать привязка" }).click();
  await expect(page.getByRole("status")).toContainText("сообщения не отправляются");
  expect(external).toEqual([]);
});

test("keyboard skip link reaches the main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Перейти к содержимому" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

test("overview has no detected WCAG AA violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
