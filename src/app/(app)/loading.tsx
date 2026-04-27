export default function AppLoading() {
  return (
    <div className="space-y-4">
      <div className="glass animate-pulse rounded-xl p-4">
        <div className="mb-4 h-6 w-56 rounded-md bg-secondary/70" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="h-24 rounded-lg bg-secondary/60" />
          <div className="h-24 rounded-lg bg-secondary/60" />
          <div className="h-24 rounded-lg bg-secondary/60" />
        </div>
      </div>

      <div className="glass animate-pulse rounded-xl p-4">
        <div className="mb-4 h-6 w-40 rounded-md bg-secondary/70" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="h-24 rounded-lg bg-secondary/60" />
          <div className="h-24 rounded-lg bg-secondary/60" />
        </div>
        <div className="mt-4 h-56 rounded-lg bg-secondary/50" />
      </div>
    </div>
  );
}
