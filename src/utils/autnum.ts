export const inRange = (autnum: number, range: string) => {
  const rangeParts = range.split("-");
  const lowerRange = Number.parseInt(rangeParts[0]);
  const upperRange = Number.parseInt(rangeParts[1]);
  return autnum >= lowerRange && autnum <= upperRange;
};
