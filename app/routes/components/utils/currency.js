export const getCurrencySymbol = (currencyCode) => {
  try {
    return (0)
      .toLocaleString("en", {
        style: "currency",
        currency: currencyCode || "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      .replace(/\d/g, "")
      .trim();
  } catch {
    return currencyCode || "$";
  }
};