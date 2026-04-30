const PALETTE = [
  ['#7C3AED', '#EDE9FE'],
  ['#2563EB', '#DBEAFE'],
  ['#059669', '#D1FAE5'],
  ['#D97706', '#FEF3C7'],
  ['#DC2626', '#FEE2E2'],
  ['#0891B2', '#CFFAFE'],
  ['#7C3AED', '#F5F3FF'],
  ['#BE185D', '#FCE7F3'],
];

function colorFor(name) {
  if (!name) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function Avatar({ name, src, size = 'md' }) {
  const sizes = {
    xs: { cls: 'w-5 h-5 text-[9px]',  px: 20 },
    sm: { cls: 'w-6 h-6 text-[10px]', px: 24 },
    md: { cls: 'w-7 h-7 text-[11px]', px: 28 },
    lg: { cls: 'w-9 h-9 text-[13px]', px: 36 },
  };
  const { cls } = sizes[size] || sizes.md;
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const [bg, fg] = colorFor(name);

  if (src) {
    return <img src={src} alt={name} className={`${cls} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${cls} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
      style={{ background: bg, color: fg }}>
      {initials}
    </div>
  );
}
