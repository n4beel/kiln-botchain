import { HTMLAttributes } from "react";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  noPadding?: boolean;
}

/** A frame, not a card: one hairline on black, square, no fill unless elevated. */
export default function Panel({ elevated, noPadding, children, className = "", style, ...props }: PanelProps) {
  return (
    <div
      className={[noPadding ? "" : "p-6", className].join(" ")}
      style={{
        background: elevated ? "var(--bg-elevated)" : "transparent",
        border: "1px solid var(--border-default)",
        borderRadius: 0,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
