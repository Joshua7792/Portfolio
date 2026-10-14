type SparkleProps = { size?: 16 | 24 | 28 | 32 | 40 | 48 | 56 | 64 | 80; className?: string };

export function Sparkle({ size = 24, className }: SparkleProps) {
  return (
    <svg aria-hidden="true" className={`sparkle ${className ?? ""}`.trim()} width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z" />
    </svg>
  );
}
