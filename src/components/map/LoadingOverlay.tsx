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

/**
 * Shown while new data loads over a map that already has something on it, so
 * a refetch never blanks the view the way LoadingOverlay does.
 */
export function RefreshingIndicator() {
  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-background/80 backdrop-blur-sm px-3 py-1 shadow-sm">
      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-muted-foreground">Updating...</span>
    </div>
  );
}
