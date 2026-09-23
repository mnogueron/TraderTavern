import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  type MetaFunction,
  type LinksFunction,
} from 'react-router';

import '@/styles/global.css';
import 'react-flagpack/dist/style.css';

import { initClient } from '@trader-tavern/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';

declare global {
  interface Window {
    ENV?: { apiUrl: string };
  }
}

// The generated OpenAPI client's paths already include the /api prefix
// (e.g. "/api/auth/login"), so the base URL passed here must NOT also
// include /api or requests double up to /api/api/....
//
// Same domain as the frontend (default): base URL is just the empty
// origin, so requests resolve as relative /api/... paths.
// Own domain (API_DOMAIN set): the API lives on a different host, so the
// browser needs its absolute origin, resolved server-side per request and
// handed to the client via `window.ENV` (see the loader/script below) —
// this keeps a single image portable across both modes without a rebuild.
export async function loader() {
  return {
    ENV: {
      apiUrl: process.env.API_DOMAIN ? `https://${process.env.API_DOMAIN}` : '',
    },
  };
}

initClient(typeof window !== 'undefined' ? (window.ENV?.apiUrl ?? '') : '');

// Runs before hydration to set the theme class synchronously, avoiding a
// flash of the wrong theme on page load.
const THEME_INIT_SCRIPT = `
  (function () {
    var theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  })();
`;

export const meta: MetaFunction = () => [
  {
    title: 'New Nx React Router App',
  },
];

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

const queryClient = new QueryClient();

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <div className="root">
          <ThemeProvider>
            <QueryClientProvider client={queryClient}>
              {children}
              <ScrollRestoration />
            </QueryClientProvider>
          </ThemeProvider>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data?.ENV).replace(/</g, '\\u003c')}`,
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
