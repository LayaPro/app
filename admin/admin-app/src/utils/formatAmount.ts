/**
 * Format number according to Indian numbering system
 * 1,00,000 (1 lakh), 10,00,000 (10 lakhs), 1,00,00,000 (1 crore)
 */
export const formatIndianAmount = (amount: number): string => {
  if (amount === 0) return '0';
  
  const numStr = Math.abs(amount).toString();
  const lastThree = numStr.substring(numStr.length - 3);
  const otherNumbers = numStr.substring(0, numStr.length - 3);
  
  if (otherNumbers !== '') {
    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
    return amount < 0 ? '-' + formatted : formatted;
  }
  
  return amount < 0 ? '-' + lastThree : lastThree;
};
