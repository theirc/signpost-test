# Security Testing for Signpost Application

This directory contains comprehensive security tests for the Signpost application, focusing on authentication, authorization, input validation, and role-based access control based on the actual application structure.

## Application Overview

The Signpost application is an AI agent management platform with the following key features:

### Main Sections
- **Agents**: Manage AI agents and their configurations
- **Templates**: Agent templates management
- **Playground**: Testing and experimentation environment
- **Evaluation**: Agent evaluation and testing
- **Knowledge**: Knowledge base management
  - **Collections**: Manage knowledge collections
  - **Sources**: Manage knowledge sources
- **Settings**: Application configuration
  - **Projects**: Project management
  - **Teams**: Team management
  - **Users**: User management
  - **Profile**: User profile settings
  - **Billing**: Billing and subscription
  - **Usage**: Usage tracking
  - **API Keys**: API key management
  - **Access Control**: Role-based access control

### User Roles
- **Owner**: Full system access
- **Admin**: Administrative access
- **Redteam Tester**: Testing and evaluation access

## Test Files

### 1. `signpost-security-tests.spec.ts`
Comprehensive security test suite covering:
- Authentication security (SQL injection, XSS, brute force protection)
- Authorization and role-based access control
- Session management and timeout handling
- Input validation and sanitization
- HTTPS and security headers
- Password security
- Error handling and information disclosure
- Data protection and API endpoint security

### 2. `role-based-security-tests.spec.ts`
Comprehensive role-based and feature security test suite covering:
- Role-based access control for all user types (Owner, Admin, Regular)
- Navigation and access to all protected routes
- Session management and navigation
- Input validation and error handling
- Data protection and API endpoint security
- All feature-specific security scenarios previously in signpost-feature-security-tests.spec.ts

## Running the Tests

### Prerequisites
- Node.js 20.x or higher
- Playwright installed: `npm install -D @playwright/test`
- Playwright browsers installed: `npx playwright install`

### Running All Security Tests
```bash
npx playwright test signpost-security-tests.spec.ts
npx playwright test role-based-security-tests.spec.ts
```

### Running Tests with UI
```bash
npx playwright test --ui
```

### Running Tests in Different Browsers
```bash
# Chrome
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# Safari
npx playwright test --project=webkit
```

## Test Categories

### Authentication Security Tests
- **Protected Route Access**: Tests that all application routes require authentication
- **Login Form Validation**: Tests email format validation and form submission
- **SQL Injection Prevention**: Tests against common SQL injection payloads
- **XSS Prevention**: Tests against cross-site scripting attacks
- **Brute Force Protection**: Tests rate limiting and account lockout

### Role-Based Access Control Tests
- **Owner Role Permissions**: Tests full system access capabilities
- **Admin Role Permissions**: Tests administrative access capabilities
- **Redteam Tester Role Permissions**: Tests testing and evaluation access
- **Restricted Access**: Tests that users cannot access unauthorized areas

### Knowledge Management Security
- **Collections Access Control**: Tests access to knowledge collections
- **Sources Access Control**: Tests access to knowledge sources
- **Data Protection**: Tests that sensitive knowledge data is properly protected

### Settings Security Tests
- **User Management Access**: Tests user management capabilities by role
- **API Keys Access**: Tests API key management access control
- **Access Control Settings**: Tests role-based access control configuration

### Session Management
- **Session Persistence**: Tests that sessions are maintained across navigation
- **Session Timeout**: Tests automatic logout after inactivity
- **Cross-Section Navigation**: Tests session maintenance across different app sections

### Input Validation and Security
- **Search Input Validation**: Tests search functionality with malicious input
- **Form Input Validation**: Tests form inputs with malicious data
- **Button and Action Security**: Tests various UI actions and buttons

### HTTPS and Security Headers
- **HTTPS Enforcement**: Tests that all communications use HTTPS
- **Security Headers**: Tests presence of important security headers:
  - `X-Frame-Options`: Prevents clickjacking
  - `X-Content-Type-Options`: Prevents MIME type sniffing
  - `X-XSS-Protection`: Enables XSS filtering
  - `Strict-Transport-Security`: Enforces HTTPS

### Error Handling
- **Information Disclosure**: Tests that error messages don't reveal sensitive data
- **Malformed Request Handling**: Tests graceful handling of invalid requests

### Data Protection
- **User Data Protection**: Tests that sensitive user data is not exposed
- **API Endpoint Protection**: Tests that API endpoints require authentication
- **Table Data Security**: Tests that table data is properly protected

## Security Test Scenarios

### 1. Authentication Bypass Attempts
- Direct access to protected routes without authentication
- SQL injection in login forms
- XSS attacks in input fields
- Brute force login attempts

### 2. Role-Based Access Control
- Owner accessing all system functions
- Admin accessing administrative functions
- Redteam Tester accessing testing functions
- Regular users accessing restricted areas

### 3. Knowledge Management Security
- Collections access and management
- Sources access and management
- Data protection and privacy

### 4. Settings and Configuration Security
- User management access control
- API key management security
- Role-based access control configuration

### 5. Input Validation
- Malicious input in search fields
- Malicious input in form fields
- Special characters and encoding attacks

### 6. Session Security
- Session timeout handling
- Cross-page session persistence
- Proper logout functionality

## Expected Results

### Pass Conditions
- All protected routes redirect to login when accessed without authentication
- Invalid credentials do not grant access
- Malicious input is properly sanitized or rejected
- Security headers are present and properly configured
- Error messages do not reveal sensitive information
- Sessions are properly managed and timeout correctly
- Role-based access control is properly enforced
- Sensitive data is not exposed in page source or responses

### Fail Conditions
- Unauthorized access to protected routes
- Successful SQL injection or XSS attacks
- Sensitive information exposed in error messages
- Missing security headers
- Session management issues
- Role-based access control failures
- Data exposure in page source or responses

## Customization

### Adding New Test Cases
1. Add new test functions to the appropriate test file
2. Follow the existing naming convention: `should [expected behavior]`
3. Include proper assertions and error handling
4. Document any special requirements or dependencies

### Modifying Test Credentials
Update the test credentials in the test files:
```typescript
// Owner user
await page.getByRole('textbox', { name: 'Email' }).fill('owner@example.com');
await page.getByRole('textbox', { name: 'Password' }).fill('ownerpassword');

// Admin user
await page.getByRole('textbox', { name: 'Email' }).fill('admin@example.com');
await page.getByRole('textbox', { name: 'Password' }).fill('adminpassword');

// Redteam Tester
await page.getByRole('textbox', { name: 'Email' }).fill('tester@example.com');
await page.getByRole('textbox', { name: 'Password' }).fill('testerpassword');
```

### Adding New Security Test Categories
1. Create a new test describe block
2. Add relevant test cases
3. Update this README with the new category
4. Ensure proper error handling and assertions

## Continuous Integration

### GitHub Actions Example
```yaml
name: Security Tests
on: [push, pull_request]
jobs:
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install
      - run: npx playwright test signpost-security-tests.spec.ts
      - run: npx playwright test role-based-security-tests.spec.ts
```

## Reporting

### HTML Report
```bash
npx playwright test --reporter=html
```

### JUnit Report
```bash
npx playwright test --reporter=junit
```

## Troubleshooting

### Common Issues
1. **Timeout Errors**: Increase timeout values for slow-loading pages
2. **Element Not Found**: Update selectors if page structure changes
3. **Authentication Issues**: Verify test credentials are correct
4. **Network Errors**: Check internet connectivity and firewall settings

### Debug Mode
```bash
npx playwright test --debug
```

## Security Best Practices

1. **Never commit real credentials** to version control
2. **Use environment variables** for sensitive test data
3. **Regularly update test cases** as application security evolves
4. **Monitor test results** for security regression
5. **Document security findings** and remediation steps

## Contributing

When adding new security tests:
1. Follow the existing code style and patterns
2. Include comprehensive error handling
3. Add appropriate documentation
4. Test thoroughly before submitting
5. Consider edge cases and attack vectors
6. Test against the actual application structure and features 