type ListingThumbProps = {
  url: string | null | undefined;
  /** Screen readers only */
  label: string;
  size?: "sm" | "md" | "lg" | "xl";
  emptyHint?: string;
};

const sizeClass: Record<NonNullable<ListingThumbProps["size"]>, string> = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-20 w-20",
  xl: "h-28 w-28 min-h-[7rem] min-w-[7rem]",
};

/**
 * Miniatura para listados (negocio / servicio). Placeholder si no hay URL.
 */
export default function ListingThumb({ url, label, size = "md", emptyHint = "No img" }: ListingThumbProps) {
  const box = sizeClass[size];
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={`${box} shrink-0 rounded-lg border border-neutral-800 object-cover`}
      />
    );
  }
  return (
    <div
      className={`${box} flex shrink-0 items-center justify-center rounded-lg border border-dashed border-neutral-700 bg-neutral-900/40 text-center text-[10px] leading-tight text-neutral-600`}
      aria-label={label}
    >
      {emptyHint}
    </div>
  );
}
