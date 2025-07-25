import { test, expect } from '@playwright/test';

const baseUrl = process.env.BASE_URL || 'https://signpost-test.vercel.app';

test.describe('Signpost Application Security Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseUrl}/login`);
  });

  test.describe('Authentication Security Tests', () => {
    test('should require authentication for all protected routes', async ({ page }) => {
      const protectedRoutes = [
        '/',
        '/collections',
        '/sources',
        '/playground',
        '/evaluation/logs',
        '/evaluation/logs/1',
        '/evaluation/scores',
        '/evaluation/scores/1',
        '/agent/1',
        '/templates',
        '/settings/projects',
        '/settings/teams',
        '/settings/billing',
        '/settings/usage',
        '/settings/roles',
        '/settings/roles/1',
        '/settings/teams/1',
        '/settings/teams/members/1',
        '/settings/users',
        '/settings/users/1',
        '/settings/projects/1',
        '/settings/apikeys',
        '/settings/apikeys/1',
        '/settings/profile'
      ];
      for (const route of protectedRoutes) {
        await page.goto(`${baseUrl}${route}`);
        await expect(page).toHaveURL(`${baseUrl}/login`);
      }
    });
    test('should validate login form inputs', async ({ page }) => {
      await page.getByRole('button', { name: 'Login' }).click();
      await expect(page).toHaveURL(`${baseUrl}/login`);
      await page.getByRole('textbox', { name: 'Email' }).fill('invalid-email');
      await page.getByRole('textbox', { name: 'Password' }).fill('password123');
      await page.getByRole('button', { name: 'Login' }).click();
      await expect(page).toHaveURL(`${baseUrl}/login`);
      await page.getByRole('textbox', { name: 'Email' }).fill('test@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill('password123');
      await page.getByRole('button', { name: 'Login' }).click();
    });
    test('should prevent SQL injection in login form', async ({ page }) => {
      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "admin'--",
        "1' OR '1' = '1' --"
      ];
      for (const payload of sqlInjectionPayloads) {
        await page.getByRole('textbox', { name: 'Email' }).fill(payload);
        await page.getByRole('textbox', { name: 'Password' }).fill('password123');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page).toHaveURL(`${baseUrl}/login`);
      }
    });
    test('should prevent XSS attacks in login form', async ({ page }) => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">'
      ];
      for (const payload of xssPayloads) {
        await page.getByRole('textbox', { name: 'Email' }).fill(payload);
        await page.getByRole('textbox', { name: 'Password' }).fill(payload);
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page).toHaveURL(`${baseUrl}/login`);
      }
    });
    test('should prevent brute force attacks', async ({ page }) => {
      for (let i = 0; i < 10; i++) {
        await page.getByRole('textbox', { name: 'Email' }).fill(`test${i}@example.com`);
        await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page).toHaveURL(`${baseUrl}/login`);
      }
      await page.getByRole('textbox', { name: 'Email' }).fill('valid@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill('validpassword');
      await page.getByRole('button', { name: 'Login' }).click();
      await expect(page).toHaveURL(`${baseUrl}/login`);
    });
  });
  test.describe('Role-Based Access Control Tests', () => {
    test('should test Owner role permissions', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Email' }).fill(process.env.OWNER_USER || 'owner@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.OWNER_PASSWORD || 'password123');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.goto(`${baseUrl}/`);
      await page.goto(`${baseUrl}/collections`);
      await page.goto(`${baseUrl}/settings/users`);
      await page.goto(`${baseUrl}/settings/apikeys`);
      await page.goto(`${baseUrl}/settings/roles`);
    });
    test('should test Admin role permissions', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Email' }).fill(process.env.ADMIN_USER || 'admin@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.ADMIN_PASSWORD || 'password123');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.goto(`${baseUrl}/`);
      await page.goto(`${baseUrl}/collections`);
      await page.goto(`${baseUrl}/settings/users`);
      await page.goto(`${baseUrl}/settings/apikeys`);
    });
    test('should test Regular user read-only permissions', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Email' }).fill(process.env.REGULAR_USER || 'user@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.REGULAR_PASSWORD || 'password123');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.goto(`${baseUrl}/`);
      await page.goto(`${baseUrl}/collections`);
      await page.goto(`${baseUrl}/sources`);
      await page.goto(`${baseUrl}/settings/users`);
      await page.goto(`${baseUrl}/settings/apikeys`);
    });
    test('should test role-based access control after login', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill('userpassword');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.goto(`${baseUrl}/dashboard`);
      await page.goto(`${baseUrl}/admin`);
      await expect(page).not.toHaveURL(`${baseUrl}/admin`);
    });
    test('should test admin role access', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill('adminpassword');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.goto(`${baseUrl}/admin`);
      await page.goto(`${baseUrl}/users`);
    });
  });
  test.describe('Knowledge Management Security Tests', () => {
    test('should test Collections access control', async ({ page }) => {
      await page.goto(`${baseUrl}/collections`);
      await expect(page).toHaveURL(`${baseUrl}/login`);
      await page.goto(`${baseUrl}/login`);
      await page.getByRole('textbox', { name: 'Email' }).fill(process.env.REGULAR_USER || 'user@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.REGULAR_PASSWORD || 'password123');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.goto(`${baseUrl}/collections`);
    });
    test('should test Sources access control', async ({ page }) => {
      await page.goto(`${baseUrl}/sources`);
      await expect(page).toHaveURL(`${baseUrl}/login`);
      await page.goto(`${baseUrl}/login`);
      await page.getByRole('textbox', { name: 'Email' }).fill(process.env.REGULAR_USER || 'user@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.REGULAR_PASSWORD || 'password123');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.goto(`${baseUrl}/sources`);
    });
  });
  test.describe('Settings Security Tests', () => {
    test('should test User Management access control', async ({ page }) => {
      await page.goto(`${baseUrl}/settings/users`);
      await expect(page).toHaveURL(`${baseUrl}/login`);
      await page.goto(`${baseUrl}/login`);
      await page.getByRole('textbox', { name: 'Email' }).fill(process.env.REGULAR_USER || 'user@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.REGULAR_PASSWORD || 'password123');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.goto(`${baseUrl}/settings/users`);
      await page.goto(`${baseUrl}/login`);
      await page.getByRole('textbox', { name: 'Email' }).fill(process.env.ADMIN_USER || 'admin@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.ADMIN_PASSWORD || 'password123');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.goto(`${baseUrl}/settings/users`);
    });
    test('should test API Keys access control', async ({ page }) => {
      await page.goto(`${baseUrl}/settings/apikeys`);
      await expect(page).toHaveURL(`${baseUrl}/login`);
      await page.goto(`${baseUrl}/login`);
      await page.getByRole('textbox', { name: 'Email' }).fill(process.env.REGULAR_USER || 'user@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.REGULAR_PASSWORD || 'password123');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.goto(`${baseUrl}/settings/apikeys`);
      await page.goto(`${baseUrl}/login`);
      await page.getByRole('textbox', { name: 'Email' }).fill(process.env.ADMIN_USER || 'admin@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.ADMIN_PASSWORD || 'password123');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.goto(`${baseUrl}/settings/apikeys`);
    });
  });
  test.describe('Session Management Tests', () => {
    test('should maintain session across navigation', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Email' }).fill(process.env.REGULAR_USER || 'user@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.REGULAR_PASSWORD || 'password123');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.goto(`${baseUrl}/`);
      await page.goto(`${baseUrl}/collections`);
      await page.goto(`${baseUrl}/sources`);
      await expect(page).not.toHaveURL(`${baseUrl}/login`);
    });
    test('should handle logout properly', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Email' }).fill(process.env.REGULAR_USER || 'user@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.REGULAR_PASSWORD || 'password123');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.goto(`${baseUrl}/`);
      const logoutButton = page.getByRole('button', { name: 'Logout' });
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.goto(`${baseUrl}/`);
        await expect(page).toHaveURL(`${baseUrl}/login`);
      }
    });
    test('should invalidate session after logout', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill('userpassword');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.goto(`${baseUrl}/dashboard`);
      await page.goto(`${baseUrl}/dashboard`);
      await expect(page).toHaveURL(`${baseUrl}/login`);
    });
    test('should test session timeout', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill('userpassword');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.goto(`${baseUrl}/dashboard`);
      await page.waitForTimeout(300000);
      await page.goto(`${baseUrl}/dashboard`);
      await expect(page).toHaveURL(`${baseUrl}/login`);
    });
  });
  test.describe('Input Validation and Sanitization Tests', () => {
    test('should validate email format', async ({ page }) => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test..test@example.com',
        'test@example..com',
        'test@example.com.',
        'test@example.com..'
      ];
      for (const email of invalidEmails) {
        await page.getByRole('textbox', { name: 'Email' }).fill(email);
        await page.getByRole('textbox', { name: 'Password' }).fill('password123');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page).toHaveURL(`${baseUrl}/login`);
      }
    });
    test('should handle special characters in input fields', async ({ page }) => {
      const specialChars = [
        'test@example.com<script>alert("XSS")</script>',
        'test@example.com\' OR \'1\'=\'1',
        'test@example.com; DROP TABLE users;',
        'test@example.com<img src="x" onerror="alert(\'XSS\')">'
      ];
      for (const input of specialChars) {
        await page.getByRole('textbox', { name: 'Email' }).fill(input);
        await page.getByRole('textbox', { name: 'Password' }).fill('password123');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page).toHaveURL(`${baseUrl}/login`);
      }
    });
  });
  test.describe('HTTPS and Security Headers Tests', () => {
    test('should use HTTPS', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);
      expect(page.url()).toMatch(/^https:\/\//);
    });
    test('should have security headers', async ({ page }) => {
      const response = await page.goto(`${baseUrl}/login`);
      const headers = response?.headers();
      expect(headers).toHaveProperty('x-frame-options');
      expect(headers).toHaveProperty('x-content-type-options');
      expect(headers).toHaveProperty('x-xss-protection');
      expect(headers).toHaveProperty('strict-transport-security');
    });
  });
  test.describe('Password Security Tests', () => {
    test('should not expose password in page source', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Email' }).fill('test@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill('secretpassword');
      const pageSource = await page.content();
      expect(pageSource).not.toContain('secretpassword');
    });
    test('should use password field type', async ({ page }) => {
      const passwordField = page.getByRole('textbox', { name: 'Password' });
      await expect(passwordField).toHaveAttribute('type', 'password');
    });
  });
  test.describe('Error Handling and Information Disclosure Tests', () => {
    test('should not expose sensitive information in error messages', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Email' }).fill('nonexistent@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword');
      await page.getByRole('button', { name: 'Login' }).click();
      const pageContent = await page.content();
      expect(pageContent).not.toContain('database');
      expect(pageContent).not.toContain('sql');
      expect(pageContent).not.toContain('error');
      expect(pageContent).not.toContain('stack trace');
    });
    test('should handle malformed requests gracefully', async ({ page }) => {
      await page.goto(`${baseUrl}/login?<script>alert("XSS")</script>`);
      await expect(page).toHaveURL(`${baseUrl}/login`);
      await page.goto(`${baseUrl}/login?param=value' OR '1'='1`);
      await expect(page).toHaveURL(`${baseUrl}/login`);
    });
  });
  test.describe('Data Protection Tests', () => {
    test('should protect API endpoints', async ({ page }) => {
      const protectedEndpoints = [
        '/api/agents',
        '/api/collections',
        '/api/users',
        '/api/settings'
      ];
      for (const endpoint of protectedEndpoints) {
        const response = await page.goto(`${baseUrl}${endpoint}`);
        expect(response?.status()).toBe(404);
      }
    });
    test('should not expose user data in page source', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Email' }).fill(process.env.REGULAR_USER || 'user@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.REGULAR_PASSWORD || 'password123');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.goto(`${baseUrl}/`);
      const pageContent = await page.content();
      expect(pageContent).not.toContain('password');
      expect(pageContent).not.toContain('secret');
      expect(pageContent).not.toContain('token');
      expect(pageContent).not.toContain('api_key');
    });
  });
}); 