// Simple footer shown at the bottom of public pages.
export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#05060f]/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row">
        <p>© {new Date().getFullYear()} ProposalForge</p>
        <p>Built for the Galuxium Nexus V2 hackathon</p>
      </div>
    </footer>
  );
}
