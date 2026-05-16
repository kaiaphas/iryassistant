import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-0 top-0 flex h-9 w-10 items-center justify-center text-slate-400">
        <Search className="h-4 w-4" aria-hidden="true" />
      </span>
      <Input className="pl-10" {...props} />
    </div>
  );
}
