type BadgeVariant = "gold" | "green" | "red" | "neutral" | "blue";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  gold: "bg-gold-500/20 text-gold-400 border-gold-500/30",
  green: "bg-success/20 text-green-400 border-success/30",
  red: "bg-danger/20 text-red-400 border-danger/30",
  neutral: "bg-dark-500/50 text-dark-200 border-dark-400/30",
  blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export function Badge({ variant = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
