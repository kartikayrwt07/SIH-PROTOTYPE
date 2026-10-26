import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AppShell } from "../components/layout/AppShell";
import { ThemeProvider } from "../contexts/ThemeContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error("Root error boundary caught:", error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SUTRA - AICTE Grievance & Case Monitoring Platform" },
      { name: "description", content: "SUTRA: Role-based complaint monitoring and lifecycle tracking platform for AICTE bureaus." },
      { name: "author", content: "AICTE Smart India Hackathon - Team SUTRA" },
      { property: "og:title", content: "SUTRA - AICTE Grievance & Case Monitoring Platform" },
      { property: "og:description", content: "SUTRA: Role-based complaint monitoring and lifecycle tracking platform for AICTE bureaus." },
      { property: "og:type", content: "website" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                var t=localStorage.getItem('aicte_theme');
                if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){
                  document.documentElement.classList.add('dark');
                }
              } catch(e){}
              function purgeLovable(){
                try {
                  var sel = '#lovable-badge, [id*="lovable-badge"], [class*="lovable-badge"], [id*="lovable_badge"], [class*="lovable_badge"], [data-lovable-badge], a[href*="lovable.dev"], a[href*="lovable.app"]';
                  var els = document.querySelectorAll(sel);
                  for (var i = 0; i < els.length; i++) {
                    els[i].remove();
                  }
                } catch(e){}
              }
              if (typeof window !== 'undefined') {
                window.addEventListener('DOMContentLoaded', purgeLovable);
                setInterval(purgeLovable, 400);
              }
            })();`,
          }}
        />
        <HeadContent />
      </head>
      <body className="antialiased selection:bg-[#9333EA]/20 selection:text-ink">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
