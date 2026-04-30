import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { getEmployees } from '../../api/employees.api.js';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import NewEmployeeDrawer from '../../components/employees/NewEmployeeDrawer.jsx';
import EmployeeDetailDrawer from '../../components/employees/EmployeeDetailDrawer.jsx';
import PageLayout from '../../components/layout/PageLayout.jsx';

const ROLE_COLORS = { ADMIN: '#F87171', MANAGER: '#FBBF24', MEMBER: '#60A5FA' };

export default function EmployeesPage() {
  const [newDrawerOpen, setNewDrawerOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const { data: employees, isLoading } = useQuery({ queryKey: ['employees'], queryFn: getEmployees });


  return (
    <PageLayout
      title="Employees"
      count={employees?.length}
      actions={<Button onClick={() => setNewDrawerOpen(true)} size="sm"><Plus size={12} /> New Employee</Button>}
    >

      {isLoading ? (
        <div className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Loading…</div>
      ) : (
        <div className="rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Employee', 'Email', 'Designation', 'Role', 'Status', 'Open Tasks', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium"
                    style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees?.map((emp, i) => (
                <tr key={emp.id}
                  style={{ borderBottom: i < (employees.length - 1) ? '1px solid var(--border-subtle)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={emp.fullName} src={emp.avatarUrl} size="sm" />
                      <button
                        onClick={() => setSelectedEmpId(emp.id)}
                        className="text-[12.5px] font-medium hover:underline text-left"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {emp.fullName}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>{emp.email}</td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>{emp.designation || '—'}</td>
                  <td className="px-4 py-3"><Badge color={ROLE_COLORS[emp.role]}>{emp.role}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge color={emp.isActive ? '#4ADE80' : '#6B6B6B'}>{emp.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    {emp._count?.assignedTasks ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedEmpId(emp.id)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                      title="View details"
                    >
                      <SlidersHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {!employees?.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                    No employees yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <NewEmployeeDrawer open={newDrawerOpen} onClose={() => setNewDrawerOpen(false)} />
      <EmployeeDetailDrawer
        employeeId={selectedEmpId}
        open={!!selectedEmpId}
        onClose={() => setSelectedEmpId(null)}
      />
    </PageLayout>
  );
}
