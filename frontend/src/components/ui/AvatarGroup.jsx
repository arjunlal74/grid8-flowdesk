import Avatar from './Avatar.jsx';

export default function AvatarGroup({ people = [], max = 3, size = 'xs' }) {
  if (!people.length) return null;
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;
  const overlap = size === 'xs' ? -6 : -8;

  return (
    <div className="flex items-center" style={{ paddingLeft: people.length > 1 ? Math.abs(overlap) : 0 }}>
      {visible.map((p, i) => (
        <div
          key={p.id || i}
          style={{
            marginLeft: i === 0 ? 0 : overlap,
            border: '2px solid var(--bg-surface)',
            borderRadius: '9999px',
            display: 'inline-flex',
          }}
          title={p.fullName}
        >
          <Avatar name={p.fullName} src={p.avatarUrl} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="flex items-center justify-center rounded-full font-semibold flex-shrink-0"
          style={{
            marginLeft: overlap,
            border: '2px solid var(--bg-surface)',
            background: 'var(--bg-surface-2)',
            color: 'var(--text-secondary)',
            width: size === 'xs' ? 20 : 24,
            height: size === 'xs' ? 20 : 24,
            fontSize: size === 'xs' ? 9 : 10,
          }}
          title={`+${overflow} more`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
