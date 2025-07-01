# Project Guidelines

This project uses:

* **[shadcn/ui](https://ui.shadcn.com/)** for UI components
* **Tailwind CSS** for styling
* **Lucide Icons** for icons
* **Supabase** as the backend service

---

## Code Style & Best Practices

* Follow the existing code style and structure. **Avoid duplicating logic** or introducing inconsistent patterns.
* **Always try to copy and adapt existing code** (when available) instead of creating new code from scratch. Maintain consistency with established patterns.
* **Always use `shadcn/ui` components** for building the UI in React.
* Use **Tailwind CSS** for all styling; avoid using custom CSS unless strictly necessary.
* Favor **composition over inheritance** in component design.
* Use **Axios** for all REST API calls.
* For accessing Supabase, **always import the instance from** `src/lib/agents/db.ts`. Do not create new Supabase clients.
* **Avoid using Prettier** or any custom formatter. Use the default VSCode formatting settings for all new code.
* Do **not add comments** unless absolutely necessary for clarity or to separate major code sections.

---

## Agent Folder Structure & Isomorphic Code

* All code under `src/lib/agents/` and its subfolders is **isomorphic** — it must be safe to run on both **client and server**.
* Do **not** place any frontend-specific code (e.g. React components, CSS, browser-only logic) inside the `src/lib/agents/` directory.
* Do **not** use `@/lib/` style imports **within** the `src/lib/agents/` directory or its subfolders — use **relative imports** instead.

---

