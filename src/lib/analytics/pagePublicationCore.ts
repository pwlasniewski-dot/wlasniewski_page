export function preservedFirstPublication(existing: Date | null, published: boolean, candidate: Date) {
  if (!published) return existing;
  if (!existing) return candidate;
  return existing <= candidate ? existing : candidate;
}
