export async function getLevelRequirement(level: number) {
  const res = await fetch(`/api/level/requirement?level=${level}`);
  return await res.json();
}
