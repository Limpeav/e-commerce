export const calculateShippingFee = () => 0;

export const getShippingQuote = (payload = {}) => {
  const fee = calculateShippingFee(payload);

  return {
    shippingPrice: fee,
    currency: "USD",
  };
};
