import Background3D from "@/components/Background3D";
import Logo from "@/components/Logo";

// Shared layout for /login and /signup.
// The (auth) folder name is in brackets, so it groups pages without adding to the URL.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Background3D />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-8">
          <Logo />
        </div>
        <div className="w-full max-w-md">{children}</div>
      </main>
    </>
  );
}
