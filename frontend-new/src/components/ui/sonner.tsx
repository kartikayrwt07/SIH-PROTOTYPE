import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme as "light" | "dark" | "system"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast font-sans group-[.toaster]:bg-white group-[.toaster]:text-[#2E2838] group-[.toaster]:border-[#E8E3EE] dark:group-[.toaster]:bg-[#0B0813] dark:group-[.toaster]:text-[#F2EEFA] dark:group-[.toaster]:border-[#201533] dark:group-[.toaster]:shadow-[0_12px_40px_rgba(0,0,0,0.85)] group-[.toaster]:shadow-xl rounded-[8px]",
          description: "group-[.toast]:text-[#5C556B] dark:group-[.toast]:text-[#A396BE]",
          actionButton: "group-[.toast]:bg-[#7052C8] dark:group-[.toast]:bg-[#9333EA] group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-[#F6F4FA] dark:group-[.toast]:bg-[#120D20] group-[.toast]:text-[#2E2838] dark:group-[.toast]:text-[#F2EEFA]",
          success:
            "group-[.toaster]:bg-emerald-50/95 group-[.toaster]:text-emerald-950 group-[.toaster]:border-emerald-200 dark:group-[.toaster]:!bg-[#07170E] dark:group-[.toaster]:!text-emerald-300 dark:group-[.toaster]:!border-emerald-800/50",
          error:
            "group-[.toaster]:bg-rose-50/95 group-[.toaster]:text-rose-950 group-[.toaster]:border-rose-200 dark:group-[.toaster]:!bg-[#1C0A0E] dark:group-[.toaster]:!text-rose-300 dark:group-[.toaster]:!border-rose-800/50",
          warning:
            "group-[.toaster]:bg-amber-50/95 group-[.toaster]:text-amber-950 group-[.toaster]:border-amber-200 dark:group-[.toaster]:!bg-[#1C1306] dark:group-[.toaster]:!text-amber-300 dark:group-[.toaster]:!border-amber-800/50",
          info:
            "group-[.toaster]:bg-purple-50/95 group-[.toaster]:text-purple-950 group-[.toaster]:border-purple-200 dark:group-[.toaster]:!bg-[#0F081C] dark:group-[.toaster]:!text-[#C084FC] dark:group-[.toaster]:!border-[#9333EA]/50",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
