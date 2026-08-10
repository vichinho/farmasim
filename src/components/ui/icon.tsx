type IconName =
  | "book"
  | "chart"
  | "home"
  | "play"
  | "sparkles"
  | "user";

type IconProps = {
  className?: string;
  name: IconName;
};

const paths: Record<IconName, string> = {
  book: "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22.5m0-17v17m0-17A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22.5",
  chart: "M4 20V10m5 10V4m5 16v-7m5 7V7",
  home: "m3 11 9-7 9 7v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zm6 10v-6h6v6",
  play: "m9 7 8 5-8 5z",
  sparkles: "m12 3-1.3 5.7L5 10l5.7 1.3L12 17l1.3-5.7L19 10l-5.7-1.3zm7 14-.6 2.4L16 20l2.4.6L19 23l.6-2.4L22 20l-2.4-.6z",
  user: "M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
};

export function Icon({ className, name }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d={paths[name]} />
    </svg>
  );
}
