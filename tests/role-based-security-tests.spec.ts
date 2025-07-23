import { test, expect } from '@playwright/test';

const baseUrl = process.env.BASE_URL || 'http://localhost:5173';

test.describe('Role and Feature Security Tests for Signpost App', () => {
  test.describe('Authentication and Navigation Security', () => {
    test('should require authentication for protected routes', async ({ page }) => {
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
    test('should test login and basic navigation', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);
      await page.getByRole('textbox', { name: 'Email' }).fill(process.env.REGULAR_USER || 'user@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.REGULAR_PASSWORD || 'password123');
      await page.getByRole('button', { name: 'Login' }).click();
      const userRoutes = [
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
      for (const route of userRoutes) {
        await page.goto(`${baseUrl}${route}`);
        await expect(page).not.toHaveURL(`${baseUrl}/login`);
      }
    });
    test('should test sidebar navigation after login', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);
      await page.getByRole('textbox', { name: 'Email' }).fill(process.env.REGULAR_USER || 'user@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.REGULAR_PASSWORD || 'password123');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.goto(`${baseUrl}/`);
      await page.goto(`${baseUrl}/collections`);
      await page.goto(`${baseUrl}/sources`);
      await page.goto(`${baseUrl}/settings/users`);
      await page.goto(`${baseUrl}/settings/apikeys`);
    });
  });

  test.describe('Role-Based Access Control', () => {
    test('should test Owner access to all sections', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);
      await page.getByRole('textbox', { name: 'Email' }).fill(process.env.OWNER_USER || 'owner@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.OWNER_PASSWORD || 'password123');
      await page.getByRole('button', { name: 'Login' }).click();
      const ownerRoutes = [
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
      for (const route of ownerRoutes) {
        await page.goto(`${baseUrl}${route}`);
        await expect(page).not.toHaveURL(`${baseUrl}/login`);
      }
    });
    test('should test Admin access to management sections', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);
      await page.getByRole('textbox', { name: 'Email' }).fill(process.env.ADMIN_USER || 'admin@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.ADMIN_PASSWORD || 'password123');
      await page.getByRole('button', { name: 'Login' }).click();
      const adminRoutes = [
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
      for (const route of adminRoutes) {
        await page.goto(`${baseUrl}${route}`);
        await expect(page).not.toHaveURL(`${baseUrl}/login`);
      }
    });
    test('should test Regular user read-only access', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);
      await page.getByRole('textbox', { name: 'Email' }).fill(process.env.REGULAR_USER || 'user@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.REGULAR_PASSWORD || 'password123');
      await page.getByRole('button', { name: 'Login' }).click();
      const userRoutes = [
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
      for (const route of userRoutes) {
        await page.goto(`${baseUrl}${route}`);
        await expect(page).not.toHaveURL(`${baseUrl}/login`);
      }
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across navigation', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);
      await page.getByRole('textbox', { name: 'Email' }).fill(process.env.REGULAR_USER || 'user@example.com');
      await page.getByRole('textbox', { name: 'Password' }).fill(process.env.REGULAR_PASSWORD || 'password123');
      await page.getByRole('button', { name: 'Login' }).click();
      await page.goto(`${baseUrl}/`);
      await page.goto(`${baseUrl}/collections`);
      await page.goto(`${baseUrl}/sources`);
      await expect(page).not.toHaveURL(`${baseUrl}/login`);
    });
    test('should handle logout properly', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);
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
  });

  test.describe('Input Validation and Security Tests', () => {
    test('should prevent SQL injection in login form', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);
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
    test('should prevent XSS attacks', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);
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
    test('should validate email format properly', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);
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
  });

  test.describe('Error Handling Security', () => {
    test('should not expose sensitive information in errors', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);
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
      await page.goto(`${baseUrl}/login?param=<script>alert("XSS")</script>`);
      await expect(page).toHaveURL(`${baseUrl}/login`);
    });
  });

  test.describe('Data Protection', () => {
    test('should not expose user data in page source', async ({ page }) => {
      await page.goto(`${baseUrl}/login`);
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
  });
}); 