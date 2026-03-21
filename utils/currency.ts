// Currency Conversion Utility
// 1 USD = 150 KES (Kenyan Shillings)
const USD_TO_KES_RATE = 150;

/**
 * Converts USD amount to KES
 */
export const convertToKES = (usdPrice: number): number => {
  return Math.round(usdPrice * USD_TO_KES_RATE);
};

/**
 * Formats a price in KES with proper currency symbol and thousands separator
 */
export const formatPrice = (priceInUSD: number): string => {
  const kesPrice = convertToKES(priceInUSD);
  return `KES ${kesPrice.toLocaleString('en-KE')}`;
};

/**
 * Converts KES back to USD (for reference)
 */
export const convertToUSD = (kesPrice: number): number => {
  return Math.round((kesPrice / USD_TO_KES_RATE) * 100) / 100;
};

/**
 * Get the conversion rate
 */
export const getExchangeRate = (): number => {
  return USD_TO_KES_RATE;
};
