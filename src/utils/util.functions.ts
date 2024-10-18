export const getDateStringFromTimestamp = (ts: number) => {
  const date = new Date(ts);

  // Format the date to the desired string format
  const options = {
    year: "numeric" as const,
    month: "numeric" as const,
    day: "numeric" as const,
    hour: "numeric" as const,
    minute: "numeric" as const,
    second: "numeric" as const,
    hour12: true,
  };

  const formattedDate = date.toLocaleString("en-US", options);
  return formattedDate;
};
