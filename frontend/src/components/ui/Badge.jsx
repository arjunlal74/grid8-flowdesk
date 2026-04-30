export default function Badge({ children, color, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium ${className}`}
      style={color ? { backgroundColor: `${color}18`, color, border: `1px solid ${color}30` } : undefined}
    >
      {children}
    </span>
  );
}

export const PriorityBadge = ({ priority }) => {
  const map = {
    LOW:    { color: '#6B6B6B', label: 'Low' },
    MEDIUM: { color: '#FBBF24', label: 'Medium' },
    HIGH:   { color: '#F87171', label: 'High' },
    URGENT: { color: '#EF4444', label: 'Urgent' },
  };
  const { color, label } = map[priority] || map.MEDIUM;
  return <Badge color={color}>{label}</Badge>;
};
