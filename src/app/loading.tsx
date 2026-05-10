import { Shield } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
