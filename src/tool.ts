// 判断字符串是否包含 BTC 地址
export const containsBTCAddress = (text: string): boolean => {
  const btcPattern = /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/;
  return btcPattern.test(text);
};

// 判断字符串是否包含 EVM 地址
export const containsEVMAddress = (text: string): boolean => {
  const evmPattern = /\b0x[a-fA-F0-9]{40}\b/;
  return evmPattern.test(text);
};
