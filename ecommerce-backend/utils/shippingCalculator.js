const roundCurrency = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const CITY_SURCHARGE = {
  "phnom penh": 0,
  kandal: 0.5,
  kampong: 1,
  kampot: 1.2,
  "siem reap": 1.5,
  battambang: 1.6,
  kep: 1.8,
  mondulkiri: 2.5,
  ratanakiri: 2.5,
};

const normalize = (value = "") => value.toString().trim().toLowerCase();

export const calculateShippingFee = ({
  shippingAddress = {},
  itemCount = 0,
  totalQuantity = 0,
  itemsPrice = 0,
} = {}) => {
  const country = normalize(shippingAddress.country || "cambodia");
  const city = normalize(shippingAddress.city || "");

  const safeItems = Math.max(1, Number(itemCount) || 1);
  const safeQuantity = Math.max(1, Number(totalQuantity) || safeItems);
  const safeItemsPrice = Math.max(0, Number(itemsPrice) || 0);

  // Base handling + packing fee.
  let fee = 1.25;
  fee += (safeQuantity - 1) * 0.35;

  // Domestic vs international base.
  const isCambodia = country === "cambodia" || country === "kh" || country === "khmer";
  if (!isCambodia) {
    fee += 5.5;
  }

  // City distance surcharge.
  if (city) {
    fee += CITY_SURCHARGE[city] || 1.25;
  } else {
    fee += 1.25;
  }

  // Discounted shipping for higher-value carts.
  if (safeItemsPrice >= 150) {
    fee = 0;
  } else if (safeItemsPrice >= 100) {
    fee *= 0.5;
  }

  return roundCurrency(Math.max(0, fee));
};

export const getShippingQuote = (payload = {}) => {
  const fee = calculateShippingFee(payload);

  return {
    shippingPrice: fee,
    currency: "USD",
  };
};
