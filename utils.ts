export const formatCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 1000000) {
    return `₹${(amount / 1000000).toFixed(2)} M`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};
