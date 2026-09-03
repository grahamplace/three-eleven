export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading data...</p>
      </div>
    </div>
  );
}
