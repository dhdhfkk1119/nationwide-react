interface BaseCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function BaseCard({ children, className = "" }: BaseCardProps) {
  return (
    <div className={`p-4 shadow rounded bg-white ${className}`}>{children}</div>
  );
}
