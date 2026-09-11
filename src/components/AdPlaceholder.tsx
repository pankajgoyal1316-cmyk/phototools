interface AdPlaceholderProps {
  variant?: 'leaderboard' | 'rectangle' | 'sidebar' | 'banner' | 'inline';
  className?: string;
}

const sizeMap: Record<string, string> = {
  leaderboard: 'min-h-[90px] md:min-h-[100px]',
  rectangle: 'min-h-[250px]',
  sidebar: 'min-h-[600px]',
  banner: 'min-h-[90px]',
  inline: 'min-h-[120px]',
};

export default function AdPlaceholder({ variant = 'inline', className = '' }: AdPlaceholderProps) {
  return (
    <div
      className={`w-full ${sizeMap[variant]} flex items-center justify-center rounded-xl border border-dashed border-app/40 bg-surface/30 ${className}`}
      aria-label="Advertisement"
    >
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-muted/60 font-semibold">Advertisement</p>
      </div>
    </div>
  );
}
