const STANDARD_MOBILE_PREFIXES = new Set([
  "10", "11", "12", "14", "15", "16", "17", "60", "61", "66", "67",
  "68", "69", "70", "77", "78", "81", "85", "86", "87", "89", "90",
  "92", "93", "95", "98", "99",
]);

const SEVEN_DIGIT_MOBILE_PREFIXES = new Set([
  "18", "31", "71", "76", "88", "96", "97",
]);

const KHMER_DIGITS = "០១២៣៤៥៦៧៨៩";

const toAsciiDigits = (value = "") =>
  String(value).replace(/[០-៩]/g, (digit) => KHMER_DIGITS.indexOf(digit));

export const toCambodiaLocalPhoneDigits = (phone = "") => {
  const digits = toAsciiDigits(phone).replace(/\D/g, "");
  const withoutCountryCode = digits.startsWith("855") ? digits.slice(3) : digits;

  return withoutCountryCode.replace(/^0+/, "");
};

export const normalizeCambodiaMobilePhone = (phone = "") => {
  const localDigits = toCambodiaLocalPhoneDigits(phone);
  const prefix = localDigits.slice(0, 2);
  const hasValidLength = SEVEN_DIGIT_MOBILE_PREFIXES.has(prefix)
    ? localDigits.length === 9
    : STANDARD_MOBILE_PREFIXES.has(prefix) && localDigits.length === 8;

  return hasValidLength ? `+855${localDigits}` : null;
};
