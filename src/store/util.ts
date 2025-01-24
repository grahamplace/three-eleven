export type StoreToEntity<T, R> = (result: T) => R;

export function firstEntity<T, R>(
  results: T[],
  storeToEntity: StoreToEntity<T, R>
): R | null {
  if (!results.length) return null;
  return storeToEntity(results[0]);
}
