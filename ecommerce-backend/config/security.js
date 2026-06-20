const WEAK_SECRET_PATTERN =
  /^(secret|mysecret|your.*secret|replace.*secret|changeme|password|admin123)$/i;

export const assertSecurityConfig = () => {
  const errors = [];
  const secret = process.env.JWT_SECRET || "";
  const allowedOrigins = String(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (secret.length < 32 || WEAK_SECRET_PATTERN.test(secret)) {
    errors.push("JWT_SECRET must be a cryptographically random value of at least 32 characters");
  }

  if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
    errors.push("ALLOWED_ORIGINS must be explicitly configured in production");
  }

  if (
    process.env.NODE_ENV === "production" &&
    allowedOrigins.some((origin) => !origin.startsWith("https://"))
  ) {
    errors.push("Every production ALLOWED_ORIGINS entry must use HTTPS");
  }

  if (process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_DEV_ORIGINS !== "false") {
    errors.push("ALLOW_LOCAL_DEV_ORIGINS must be false in production");
  }

  if (errors.length > 0 && process.env.NODE_ENV === "production") {
    throw new Error(`Unsafe security configuration: ${errors.join("; ")}`);
  }

  if (errors.length > 0) {
    console.warn(`Development security warning: ${errors.join("; ")}`);
  }
};
