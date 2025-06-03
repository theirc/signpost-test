
The following document outlines the code styling and rules used at Signpost

---

# Code Styling Guidelines

To ensure consistency, readability, and maintainability across the codebase, please adhere to the following code styling conventions:

### 1. JavaScript/TypeScript Style Guide

Familiarize yourself thoroughly with the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript). It serves as the foundational standard for our codebase and outlines best practices for writing clean and idiomatic JavaScript/TypeScript.

### 2. Code Formatting

Avoid using **Prettier** for code formatting. Instead, rely on the **default formatting settings provided by Visual Studio Code (VSCode)**. This helps maintain consistency in formatting across the team without the need for external tools.

### 3. Inline Blocks

Whenever possible, simplify control statements by using inline blocks. Avoid using curly braces for single-line statements, as this promotes cleaner and more concise code.
In general, aim to write inline and compact code. Avoid unnecessary vertical spacing or deeply nested blocks. Keeping the code visually concise improves readability and reduces cognitive load, especially when scanning or reviewing logic quickly.
However, prioritize clarity over brevity—do not sacrifice readability for the sake of making everything inline. Use discretion when determining when to expand logic for better understanding.


```typescript
// Not preferred
if (condition) {
  return 4;
}

// Preferred
if (condition) return 4;
```

### 4. Code Comments

Only add comments where the logic or intent of the code is not immediately obvious. Avoid redundant comments that merely restate what the code already clearly expresses.

* ✅ **Do comment** complex logic, assumptions, edge cases, or unexpected behavior.
* ✅ **Comment** any use of "magic numbers" or constants whose purpose may not be self-evident.

```typescript
// Bad
let timeout = 5000; // set timeout to 5000

// Good
let timeout = 5000; // Timeout in milliseconds before retrying the request
```

### 5. Additional Recommendations

* Use meaningful variable and function names that reflect their purpose.
* Keep functions small and focused on a single responsibility.
* Maintain consistent indentation and spacing throughout the code.

Following these conventions will contribute to a more readable, maintainable, and collaborative codebase.



# Writing Code: Best Practices

To maintain a clean, efficient, and maintainable codebase, please follow these principles and guidelines when writing code:

### 1. Embrace Established Principles

* **DRY (Don't Repeat Yourself):** Avoid code duplication by abstracting repeated logic into reusable functions or components.
* **KISS (Keep It Simple, Stupid):** Aim for simplicity in design and implementation. Avoid overengineering or unnecessary abstractions.

### 2. Prefer Functions Over Constants for Behavior

Always use named functions rather than assigning functions to constants when possible. Named functions are parsed and compiled earlier by the JavaScript engine, offering performance and debugging advantages.

```typescript
// Preferred
function calculateTotal() {
  // ...
}

// Avoid
const calculateTotal = () => {
  // ...
};
```

### 3. Dependency Management

* **Do not add new libraries without prior approval.**
* Aim to **minimize dependencies** to reduce bundle size, simplify maintenance, and avoid unnecessary complexity.
* Only include libraries that are **well-maintained**, **widely adopted**, and **actively supported**.

### 4. Monitor Console Output During Development

Always keep the browser or Node.js console open while developing. Pay close attention to any warnings or errors, and resolve issues immediately to ensure a stable and error-free application.

### 5. Favor Functional Programming and Closures Over Classes

Whenever possible, write code using **functional programming principles**. Prefer closures and pure functions over class-based designs, which often introduce unnecessary complexity and state management issues.

### 6. Configuration Consistency

* **Do not modify the Tailwind CSS configuration.**
* **Avoid altering the default components provided by shadcn.**
  Changes to these shared configurations can introduce inconsistencies and unexpected side effects across the application.

### 7. Responsible Use of AI Tools

If using AI-assisted tools (e.g., GitHub Copilot, ChatGPT) for code generation:

* Ensure that **all generated code aligns with project standards**.
* Validate that it **uses only the approved libraries and existing project structure**.
* Review and test AI-generated code carefully before committing.


# Database Design Guidelines

To ensure clarity, consistency, and scalability in our database schema, please follow the conventions outlined below:

### 1. Table Naming

* Use **plural** nouns for all table names to represent collections of records.

  * ✅ `users`, `orders`, `products`
  * ❌ `user`, `order`, `product`

* Always use **lowercase** names for tables to avoid issues with case sensitivity across different database systems and tooling.

### 2. Column Naming

* Use **lowercase** column names consistently for readability and cross-platform compatibility.
* Avoid using underscores or prefixes like `_id` in foreign key columns.

  * Instead, name foreign key columns **exactly after the referenced table**, in **singular form**. This promotes clarity and simplifies query understanding.

```sql

-- ✅ Preferred
services
- id
- user (references users.id)
- country (references countries.id)

-- ❌ Not preferred
services
- id
- user_id
- country_id

```

### 3. General Recommendations

* Stick to **clear, concise, and descriptive names** for both tables and columns.
* Use **snake\_case** for multi-word column names, if needed (e.g., `created_at`, `total_amount`).

By adhering to these conventions, we promote a database structure that is consistent, intuitive, and easy to work with for all team members.







