import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors border",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-800 border-slate-200",
        primary: "bg-orange-50 text-orange-700 border-orange-200/80 font-medium",
        brand: "bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-rose-500/10 text-orange-600 border-orange-500/20 font-semibold",
        brandSolid: "bg-gradient-to-r from-orange-500 to-pink-500 text-white border-transparent font-semibold shadow-xs",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium",
        warning: "bg-amber-50 text-amber-800 border-amber-200 font-medium",
        danger: "bg-rose-50 text-rose-700 border-rose-200 font-medium",
        destructive: "bg-rose-50 text-rose-700 border-rose-200 font-medium",
        info: "bg-slate-100 text-slate-800 border-slate-200",
        secondary: "bg-pink-50 text-pink-700 border-pink-200/80 font-medium",
        outline: "bg-transparent text-slate-700 border-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
