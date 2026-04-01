import { useState, useRef } from "react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface InlineCategorySelectProps {
  value: string;
  txType: "cash_in" | "cash_out";
  categories: { id: string; name: string; type: string }[];
  onSave: (newCategory: string) => Promise<void>;
  className?: string;
}

export default function InlineCategorySelect({
  value,
  txType,
  categories,
  onSave,
  className = "",
}: InlineCategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const filteredCategories = categories.filter((c) =>
    txType === "cash_in" ? c.type === "income" : c.type === "expense"
  );

  const handleSelect = async (newValue: string) => {
    if (newValue === value || saving) return;
    setOpen(false);
    setSaving(true);
    try {
      await onSave(newValue);
      toast({ title: "Category updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "text-sm font-medium truncate cursor-pointer hover:underline decoration-dotted underline-offset-2 transition-colors text-left",
            saving && "opacity-50 pointer-events-none",
            className,
          )}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          {value}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-1 z-[300] bg-popover border border-border shadow-md"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-52 overflow-y-auto">
          {filteredCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                c.name === value && "bg-accent text-accent-foreground font-medium",
              )}
              onClick={() => handleSelect(c.name)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
