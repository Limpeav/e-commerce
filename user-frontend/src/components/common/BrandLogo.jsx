import { useDarkMode } from "../../hooks";
import darkModeLogo from "../../assets/logo-dark.png";
import lightModeLogo from "../../assets/logo-light.png";

export default function BrandLogo({
  alt = "Cherish Baby Store Logo",
  className = "",
}) {
  const [isDark] = useDarkMode();

  return (
    <img
      src={isDark ? darkModeLogo : lightModeLogo}
      alt={alt}
      className={className}
    />
  );
}
