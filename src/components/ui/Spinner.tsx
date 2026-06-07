import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 24, className = "" }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="animate-spin text-primary" style={{ width: size, height: size }} />
    </div>
  );
}
