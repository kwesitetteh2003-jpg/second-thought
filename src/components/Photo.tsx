/** Self-hosted, pre-sized webp photos (see README › Photo credits). */
export type PhotoName = "kofi-phone" | "night-phone" | "accra-market";
const WIDTHS = [640, 1080, 1600] as const;

export function Photo({ name, alt, sizes, className, style, priority = false }: {
  name: PhotoName; alt: string; sizes: string; className?: string; style?: React.CSSProperties; priority?: boolean;
}) {
  return (
    <img
      src={`/photos/${name}-1080.webp`}
      srcSet={WIDTHS.map((w) => `/photos/${name}-${w}.webp ${w}w`).join(", ")}
      sizes={sizes}
      alt={alt}
      className={className}
      style={style}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}

export const CREDITS: Record<PhotoName, { by: string; url: string }> = {
  "kofi-phone": { by: "Zeal Creative Studios", url: "https://www.pexels.com/photo/young-ghanaian-man-engaged-with-smartphone-34439202/" },
  "night-phone": { by: "Kenneth Surillo", url: "https://www.pexels.com/photo/lying-man-using-smartphone-20885707/" },
  "accra-market": { by: "Zeal Creative Studios", url: "https://www.pexels.com/photo/bustling-market-scene-in-accra-ghana-36392318/" },
};

export function Credit({ name, children }: { name: PhotoName; children?: React.ReactNode }) {
  const c = CREDITS[name];
  return (
    <p className="caption">
      {children}{children ? " " : ""}Photo: <a href={c.url} target="_blank" rel="noreferrer">{c.by}, Pexels</a>
    </p>
  );
}
