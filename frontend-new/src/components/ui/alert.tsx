import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm transition-colors [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default:
          "bg-background dark:bg-[#0B0813] text-foreground dark:text-[#F2EEFA] border-border dark:border-[#201533]",
        destructive:
          "border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/25 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 [&>svg]:text-rose-600 dark:[&>svg]:text-rose-400",
        warning:
          "border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/25 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400",
        success:
          "border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/25 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400",
        purple:
          "border-[#9333EA]/30 bg-[#9333EA]/10 dark:bg-[#9333EA]/15 dark:border-[#9333EA]/40 text-[#7052C8] dark:text-[#C084FC] [&>svg]:text-[#9333EA] dark:[&>svg]:text-[#C084FC]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
