import { useEffect } from "react";

interface NotFoundProps {
  /** The path that was asked for. Passed in by `App`, which already read it. */
  pathname: string;
}

/**
 * Shown when the URL does not address the app's entry point.
 *
 * Reachable only where the host rewrites unknown paths to index.html (the usual
 * SPA fallback). A host that answers unknown paths with a real 404 never loads the
 * bundle, so this page is a second line of defence rather than the only one.
 */
const NotFound = ({ pathname }: NotFoundProps) => {
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", pathname);
  }, [pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        {/*
          A full document load, not a client-side navigation: there is no router to
          hand the URL to. `BASE_URL` rather than "/" so this still points at the app
          under a sub-path deploy.
        */}
        <a href={import.meta.env.BASE_URL} className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
