import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getEmployee } from '../../api/employees.api.js';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';

const ROLE_COLORS = { ADMIN: '#F87171', MANAGER: '#FBBF24', MEMBER: '#6B6B6B' };

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: emp, isLoading } = useQuery({ queryKey: ['employee', id], queryFn: () => getEmployee(id) });

  if (isLoading) return <div className="p-6 text-text-tertiary text-[13px]">Loading…</div>;
  if (!emp) return <div className="p-6 text-danger text-[13px]">Employee not found</div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/employees')} className="text-text-tertiary hover:text-text-primary text-[13px]">← Employees</button>
      </div>

      <div className="bg-bg-surface border rounded-card p-6 max-w-xl">
        <div className="flex items-start gap-5">
          <Avatar name={emp.fullName} src={emp.avatarUrl} size="lg" />
          <div className="flex-1">
            <h1 className="text-[22px] font-semibold text-text-primary">{emp.fullName}</h1>
            {emp.designation && <p className="text-[14px] text-text-secondary mt-0.5">{emp.designation}</p>}
            <div className="flex items-center gap-2 mt-2">
              <Badge color={ROLE_COLORS[emp.role]}>{emp.role}</Badge>
              <Badge color={emp.isActive ? '#4ADE80' : '#6B6B6B'}>{emp.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 text-[13px]">
          {[
            ['Email', emp.email],
            ['Phone', emp.phone],
            ['Department', emp.department],
            ['Open Tasks', emp._count?.assignedTasks ?? 0],
            ['Joined', emp.joinedAt ? new Date(emp.joinedAt).toLocaleDateString('en-IN') : null],
            ['Last Login', emp.lastLoginAt ? new Date(emp.lastLoginAt).toLocaleString() : 'Never'],
          ].map(([k, v]) => v !== null && v !== undefined ? (
            <div key={k}>
              <p className="text-text-tertiary text-[11px] mb-0.5">{k}</p>
              <p className="text-text-primary">{v}</p>
            </div>
          ) : null)}
        </div>
      </div>
    </div>
  );
}
