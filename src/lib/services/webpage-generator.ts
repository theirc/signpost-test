export interface WebpageConfig {
  title: string
  description: string
  primaryColor: string
  secondaryColor: string
  logoUrl?: string
  customDomain?: string
  enableChat: boolean
  enableAnalytics: boolean
  theme: 'light' | 'dark' | 'auto'
  agentId: string
  agentTitle: string
  agentDescription?: string
}

export interface DeploymentInfo {
  id: string
  agentId: string
  deploymentUrl: string
  customDomain?: string
  config: WebpageConfig
  createdAt: string
  status: 'deployed' | 'failed' | 'pending'
}

export function generateWebpageHTML(config: WebpageConfig): string {
  const { title, description, primaryColor, secondaryColor, logoUrl, theme, enableChat, enableAnalytics } = config
  
  return `<!DOCTYPE html>
<html lang="en" class="${theme}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '${primaryColor}',
                        secondary: '${secondaryColor}'
                    }
                }
            }
        }
    </script>
    
    ${enableAnalytics ? `
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'GA_MEASUREMENT_ID');
    </script>
    ` : ''}
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
        }
        
        .chat-container {
            background: linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20);
        }
        .chat-bubble {
            background: ${primaryColor};
        }
        .theme-dark {
            background-color: #1f2937;
            color: #f9fafb;
        }
        .theme-light {
            background-color: #ffffff;
            color: #111827;
        }
        .theme-auto {
            background-color: #ffffff;
            color: #111827;
        }
        @media (prefers-color-scheme: dark) {
            .theme-auto {
                background-color: #1f2937;
                color: #f9fafb;
            }
        }
        
        /* Dark mode specific styles */
        .theme-dark .bg-white {
            background-color: #1f2937;
        }
        .theme-dark .border-gray-200 {
            border-color: #374151;
        }
        .theme-dark .text-gray-900 {
            color: #f9fafb;
        }
        .theme-dark .text-gray-500 {
            color: #9ca3af;
        }
        .theme-dark .text-gray-600 {
            color: #d1d5db;
        }
        .theme-dark .bg-gray-50 {
            background-color: #111827;
        }
        .theme-dark .border-gray-200 {
            border-color: #374151;
        }
        .theme-dark .hover\\:bg-gray-100:hover {
            background-color: #374151;
        }
        
        /* Ensure full viewport coverage */
        html, body {
            height: 100%;
            width: 100%;
            overflow-x: hidden;
        }
        
        /* Remove any potential app-specific styles */
        .webpage-container {
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            position: relative;
        }
    </style>
</head>
<body class="theme-${theme}">
    <div class="min-h-screen flex flex-col w-full">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b border-gray-200 w-full">
            <div class="w-full px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-4">
                    <div class="flex items-center space-x-3">
                        ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="h-8 w-8 rounded">` : ''}
                        <h1 class="text-xl font-semibold text-gray-900">${title}</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button id="theme-toggle" class="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 flex flex-col w-full">
            <!-- Chat Area -->
            <div class="flex-1 flex flex-col min-h-0">
                <div class="flex-1 overflow-y-auto p-6">
                    <div class="max-w-4xl mx-auto space-y-6">
                        <div class="flex flex-col items-center justify-center h-full min-h-[65vh]">
                            <h1 class="text-4xl font-bold text-center text-transparent bg-clip-text gradient-text-animation slide-reveal-greeting" style="background-image: linear-gradient(to right, ${primaryColor}, ${secondaryColor});">
                                Hello, how can I help you?
                            </h1>
                        </div>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="bg-white pb-4 pt-2 px-4 flex-shrink-0 border-t">
                    <div class="max-w-4xl mx-auto">
                        <div class="relative bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div class="flex flex-col w-full">
                                <div class="px-2 py-3 max-h-80 overflow-y-auto">
                                    <textarea placeholder="Type your message here." 
                                              class="w-full outline-none resize-none py-1 px-1 text-sm min-h-[40px] text-gray-900"
                                              style="font-family: Inter, sans-serif"></textarea>
                                </div>
                                
                                <div class="flex justify-between items-center p-2">
                                    <div class="flex items-center space-x-2">
                                        <button class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100">
                                            <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                            </svg>
                                        </button>
                                        <button class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100">
                                            <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                            </svg>
                                        </button>
                                    </div>
                                    <div>
                                        <button class="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white">
                                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p class="text-xs text-gray-500 text-center mt-2">
                            Signpost AI is experimental. Please validate results. Supports both text and JSON input.
                        </p>
                    </div>
                </div>
            </div>
        </main>
        </main>

        <!-- Footer -->
        <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 w-full">
            <div class="w-full px-4 sm:px-6 lg:px-8 py-4">
                <div class="flex justify-between items-center">
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Powered by <a href="https://aprendia.com" class="text-primary hover:underline">Aprendia Education</a>
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        © ${new Date().getFullYear()} All rights reserved
                    </p>
                </div>
            </div>
        </footer>
    </div>

    ${enableChat ? `
    <script>
        // Theme functionality
        const themeToggle = document.getElementById('theme-toggle');
        const html = document.documentElement;
        
        // Check for saved theme preference or default to 'auto'
        const savedTheme = localStorage.getItem('theme') || 'auto';
        html.className = \`theme-\${savedTheme}\`;
        
        // Theme toggle functionality
        themeToggle.addEventListener('click', () => {
            const currentTheme = html.className.includes('dark') ? 'light' : 'dark';
            html.className = \`theme-\${currentTheme}\`;
            localStorage.setItem('theme', currentTheme);
        });
        
        // Auto theme detection
        if (savedTheme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            html.className = prefersDark ? 'theme-dark' : 'theme-light';
        }
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (savedTheme === 'auto') {
                html.className = e.matches ? 'theme-dark' : 'theme-light';
            }
        });
    </script>
    ` : ''}
</body>
</html>`
}

export function generateDeploymentUrl(config: WebpageConfig): string {
  if (config.customDomain) {
    return `https://${config.customDomain}`
  }
  
  const slug = config.title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  
  // Use relative URL within the Vercel app
  return `/webpage/${slug}`
} 