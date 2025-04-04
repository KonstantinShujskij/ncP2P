import { test, expect } from '@playwright/test';
import axios from 'axios';

// Токен твого Telegram бота
const TELEGRAM_BOT_API_TOKEN = '7732482149:AAGy674QRsQ0Gdf15CqUUncQmzkY11MUU2w';
// ID чату, куди надсилаються 2FA коди
const CHAT_ID = '5554362792'; 

async function get2FACodeFromTelegram() {
  // Запит до Telegram API, щоб отримати останнє повідомлення від бота
  const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_API_TOKEN}/getUpdates`);
  
  // Перевірка на наявність повідомлень
  if (response.data.result.length === 0) {
    throw new Error('No messages found in Telegram');
  }

  // Отримуємо текст останнього повідомлення
  const lastMessage = response.data.result[response.data.result.length - 1];
  const code = lastMessage.message.text.trim(); // Припускаємо, що код знаходиться в тексті повідомлення

  return code;
}

test('Login with 2FA using Telegram code', async ({ page }) => {
  // Перехід на сторінку логіну
  await page.goto('http://localhost:3000/');

  // Заповнення форми логіну
  await page.getByRole('textbox', { name: 'Login' }).fill('justdes');
  await page.getByRole('textbox', { name: 'Password' }).fill('chuprin03091993');

  // Клік на кнопку "Lets Go"
  await page.getByRole('button', { name: 'Lets Go' }).click();

  // Чекаємо появи поля для вводу 2FA
  await page.getByRole('textbox', { name: 'Code' }).waitFor();

  await page.waitForTimeout(2000); // чекаємо 2 секунди на появу елементів

  // Отримуємо код з Telegram
  const code = await get2FACodeFromTelegram();

  // Вводимо код 2FA
  await page.getByRole('textbox', { name: 'Code' }).fill(code);

  // Клік на кнопку "Approve"
  await page.getByRole('button', { name: 'Approve' }).click();

  // Перевірка, що після логіну сторінка перенаправила на /dashboard
  await expect(page).toHaveURL('/dashboard');
});
