export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void" aria-hidden>
      <div className="absolute -left-[10%] -top-[25%] h-[70vh] w-[60vw] animate-drift-a rounded-full opacity-[0.22] blur-[120px]" style={{ background: "radial-gradient(closest-side, #1fd6b0, transparent)" }} />
      <div className="absolute -right-[12%] top-[5%] h-[65vh] w-[55vw] animate-drift-b rounded-full opacity-[0.2] blur-[130px]" style={{ background: "radial-gradient(closest-side, #4f6bff, transparent)" }} />
      <div className="absolute bottom-[-30%] left-[30%] h-[60vh] w-[50vw] animate-drift-a rounded-full opacity-[0.12] blur-[140px]" style={{ background: "radial-gradient(closest-side, #9a6bff, transparent)" }} />
      <div className="grid-bg absolute inset-0" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 120%, rgba(0,0,0,0.9), transparent 60%)" }} />
    </div>
  );
}
