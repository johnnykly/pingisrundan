export default function Loading() {
  const bar = "rounded-box bg-surface-2 motion-safe:animate-pulse";
  return (
    <div aria-busy="true" className="grid gap-6">
      <div className={`${bar} h-10 w-48`} />
      <div className="grid gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={`${bar} h-12`} />
        ))}
      </div>
    </div>
  );
}
