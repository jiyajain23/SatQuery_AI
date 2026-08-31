import { Link } from "@tanstack/react-router";

/**
 * The mockups use one shape for every action: a 9999px pill, either solid
 * black (primary / selected) or hairline-outlined (secondary / unselected).
 */
export function Pill({
  children,
  selected = false,
  solid = false,
  size,
  variant,
  className = "",
  ...rest
}) {
  const cls = [
    "sq-pill",
    selected || solid ? "sq-pill--solid" : "sq-pill--outline",
    size === "lg" ? "sq-pill--lg" : size === "sm" ? "sq-pill--sm" : "",
    variant === "nav" ? "sq-pill--nav" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}

export function PillLink({
  children,
  to,
  solid = false,
  size,
  disabled = false,
  className = "",
  ...rest
}) {
  const cls = [
    "sq-pill",
    solid ? "sq-pill--solid" : "sq-pill--outline",
    size === "lg" ? "sq-pill--lg" : size === "sm" ? "sq-pill--sm" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (disabled) {
    return (
      <span className={cls} aria-disabled="true">
        {children}
      </span>
    );
  }

  return (
    <Link to={to} className={cls} {...rest}>
      {children}
    </Link>
  );
}
