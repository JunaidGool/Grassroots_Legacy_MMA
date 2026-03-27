interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  accent?: boolean;
  gold?: boolean;
}

export function Card({ children, className = "", accent = false, gold = false, ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-xl bg-surface border border-border
        ${accent ? "border-t-2 border-t-gold-500" : ""}
        ${gold ? "border-gold-500/40 bg-linear-to-b from-gold-500/5 to-transparent" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-4 py-3 border-b border-border ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-4 py-4 ${className}`} {...props}>{children}</div>;
}
