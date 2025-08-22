import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Root Layout: app/page.tsx (serves documentation at root)
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <img
          src="/images/screenshots/logo/signpost-ai-logo.png"
          alt="Signpost AI Logo"
          width="120"
          height="120"
          className="rounded"
        />
      </>
    ),
  },
  links: [],
};
