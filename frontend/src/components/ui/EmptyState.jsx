export default function EmptyState({ icon: Icon, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      {Icon && <Icon size={32} className="text-text-disabled" />}
      <p className="text-[13px] text-text-tertiary">{message}</p>
      {action}
    </div>
  );
}
