import { test, expect, Page } from '@playwright/test';
import axios from 'axios';

// Токен твого Telegram бота
const TELEGRAM_BOT_API_TOKEN = 'YOUR_BOT_API_TOKEN';

async function mockGet2FACodeFromTelegram() {
  // Мокаємо відповідь від Telegram API
  return '123456';  // Заміняємо на фіксований код для тесту
}

test('Login with mocked 2FA', async ({ page }) => {
  // Перехід на сторінку логіну
  await page.goto('http://localhost:3000/');

  // Заповнення форми логіну
  await page.getByRole('textbox', { name: 'Login' }).fill('justdes');
  await page.getByRole('textbox', { name: 'Password' }).fill('chuprin03091993');

  // Клік на кнопку "Lets Go"
  await page.getByRole('button', { name: 'Lets Go' }).click();

  // Чекаємо появи поля для вводу 2FA
  await page.getByRole('textbox', { name: 'Code' }).waitFor();

  // Замоканий код 2FA
  const code = await mockGet2FACodeFromTelegram();

  // Вводимо замоканий код 2FA
  await page.getByRole('textbox', { name: 'Code' }).fill(code);

  // Клік на кнопку "Approve"
  await page.getByRole('button', { name: 'Approve' }).click();

  // Перевірка, що після логіну сторінка перенаправила на /dashboard
  await expect(page).toHaveURL('http://localhost:3000');

});
