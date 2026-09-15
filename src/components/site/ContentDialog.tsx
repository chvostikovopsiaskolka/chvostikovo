import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ContentDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94dvh] w-[calc(100%-0.75rem)] max-w-3xl grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-2xl border-none bg-card p-0 shadow-soft sm:max-h-[90dvh] sm:w-[calc(100%-1.5rem)] sm:rounded-[2rem] [&>button]:right-3 [&>button]:top-3 [&>button]:flex [&>button]:size-9 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-xl [&>button]:bg-secondary [&>button]:opacity-100 sm:[&>button]:right-5 sm:[&>button]:top-5 sm:[&>button]:size-10">
        <DialogHeader className="border-b border-forest/10 px-4 py-4 pr-14 sm:px-7 sm:py-6 sm:pr-20">
          <DialogTitle className="text-left font-display text-xl font-bold leading-tight text-forest sm:text-3xl">
            {title}
          </DialogTitle>
          {subtitle && (
            <p className="mt-1 pr-1 text-left text-sm leading-relaxed text-forest/65 sm:pr-2 sm:text-base">
              {subtitle}
            </p>
          )}
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-4 py-4 sm:px-7 sm:py-6">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
