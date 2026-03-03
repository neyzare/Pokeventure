import "../tailwind.css";

/**
 * Minimal layout for error page - no Nav, no hooks.
 * Avoids cascading failures when the main Layout/Nav would throw.
 */
export default function ErrorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="light" className="min-h-screen bg-base-100 text-base-content flex flex-col items-center justify-center p-8">
      {children}
    </div>
  );
}
