// The animated background behind every public page:
// drifting color blobs + a neon 3D grid floor. It doesn't react to the mouse.
// All the animation lives in globals.css (.blob, .grid-floor).
export default function Background3D() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
      <div className="blob left-[-10%] top-[-10%] h-[45vw] w-[45vw] bg-indigo-600" />
      <div
        className="blob right-[-10%] top-[20%] h-[40vw] w-[40vw] bg-fuchsia-600"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="blob bottom-[-15%] left-[30%] h-[35vw] w-[35vw] bg-cyan-500"
        style={{ animationDelay: "-12s" }}
      />
      <div className="grid-floor" />
    </div>
  );
}
