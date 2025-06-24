// utils/__tests__/DropBox.spec.js

// 1) Мок 'config' перед усіма імпортами
jest.mock('config', () => ({
  get: jest.fn(key => {
    switch (key) {
      case 'dropBoxRefreshToken': return 'refresh_token';
      case 'dropBoxApiKey':       return 'api_key';
      case 'dropBoxApiSecret':    return 'api_secret';
      default:                    return undefined;
    }
  })
}));

// 2) Мок 'node-fetch' і 'fs'
jest.mock('node-fetch');
jest.mock('fs');

const fetch = require('node-fetch');
const fs = require('fs');
const config = require('config');

// Після моків – імпортуємо saveKvit
const { saveKvit } = require('../DropBox');

describe('utils/DropBox.saveKvit', () => {
  const dummyBuffer = Buffer.from('file-contents');

  beforeEach(() => {
    jest.resetAllMocks();
    // Файл існує й читається
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(dummyBuffer);
  });

  it('успішний шлях: повертає спільне посилання', async () => {
    // Мокаємо чотири запити fetch:
    fetch
      // 1-й виклик: getAccessToken в uploadFile
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'ACCESS_TOKEN' })
      })
      // 2-й виклик: uploadFile → files/upload
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ path_lower: '/dropbox/path/file.pdf' })
      })
      // 3-й виклик: getAccessToken в getSharedLink
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'ACCESS_TOKEN' })
      })
      // 4-й виклик: getSharedLink → create_shared_link
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://dropbox.link/file.pdf' })
      });

    const result = await saveKvit('file.pdf');

    // Переконуємося в порядку викликів:
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'https://api.dropboxapi.com/oauth2/token',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: expect.any(URLSearchParams)
      })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://content.dropboxapi.com/2/files/upload',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer ACCESS_TOKEN',
          'Dropbox-API-Arg': expect.any(String),
          'Content-Type': 'application/octet-stream'
        }),
        body: dummyBuffer
      })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      'https://api.dropboxapi.com/oauth2/token',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: expect.any(URLSearchParams)
      })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      4,
      'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer ACCESS_TOKEN',
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          path: '/dropbox/path/file.pdf',
          settings: {
            requested_visibility: 'public',
            audience: 'public',
            access: 'viewer'
          }
        })
      })
    );

    expect(result).toBe('https://dropbox.link/file.pdf');
  });

  it('повертає null при мережевій помилці', async () => {
    fetch.mockImplementation(() => { throw new Error('network error'); });
    const result = await saveKvit('any.pdf');
    expect(result).toBeNull();
  });

  it('повертає null, якщо getAccessToken повернув null (ok=false)', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'bad' })
    });
    const result = await saveKvit('any.pdf');
    expect(result).toBeNull();
  });

  it('повертає null, якщо файл не знайдено', async () => {
    // отримуємо токен успішно
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'ACCESS_TOKEN' })
    });
    fs.existsSync.mockReturnValue(false);

    const result = await saveKvit('missing.pdf');
    expect(result).toBeNull();
  });
});
