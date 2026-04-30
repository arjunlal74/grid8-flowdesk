import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, LayoutGrid, List, Search } from 'lucide-react';
import { getLeads, moveLead } from '../../api/leads.api.js';
import KanbanBoard from '../../components/kanban/KanbanBoard.jsx';
import Badge, { PriorityBadge } from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Button from '../../components/ui/Button.jsx';
import NewLeadDrawer from '../../components/leads/NewLeadDrawer.jsx';
import PageLayout from '../../components/layout/PageLayout.jsx';
import toast from 'react-hot-toast';

export default function LeadsPage() {
  const [view, setView] = useState('list');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [defaultStatusId, setDefaultStatusId] = useState(null);
  const qc = useQueryClient();

  const params = { view, page, limit: 25, ...(search && { search }) };
  const { data, isLoading } = useQuery({ queryKey: ['leads', params], queryFn: () => getLeads(params) });

  const { mutate: moveLeadMutation } = useMutation({
    mutationFn: ({ id, data }) => moveLead(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); toast.success('Lead moved'); },
  });

  const headerActions = (
    <>
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-disabled)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search leads…"
          className="rounded-lg pl-8 pr-3 py-1.5 text-[12px] focus:outline-none w-48 transition-colors"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
        />
      </div>
      <div className="flex items-center rounded-lg p-0.5" style={{ background: 'var(--bg-surface)' }}>
        {[{ v: 'list', I: List }, { v: 'kanban', I: LayoutGrid }].map(({ v, I }) => (
          <button key={v} onClick={() => setView(v)}
            className="p-1.5 rounded-md transition-colors"
            style={{ background: view === v ? 'var(--bg-surface-2)' : 'transparent', color: view === v ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
            <I size={13} />
          </button>
        ))}
      </div>
      <Button onClick={() => { setDefaultStatusId(null); setDrawerOpen(true); }} size="sm">
        <Plus size={12} /> New Lead
      </Button>
    </>
  );

  return (
    <PageLayout title="Leads" count={view === 'list' ? data?.total : undefined} actions={headerActions}>

      {isLoading ? (
        <div className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Loading…</div>
      ) : view === 'kanban' ? (
        <KanbanBoard columns={data || []} type="lead"
          onMove={(id, d) => moveLeadMutation({ id, data: d })}
          onAddClick={(statusId) => { setDefaultStatusId(statusId); setDrawerOpen(true); }} />
      ) : (
        <div className="rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Contact', 'Company', 'Status', 'Priority', 'Owner', 'Value', 'Close Date'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium"
                    style={{ color: 'var(--text-tertiary)' }}>{h}</th>
                ))}
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((lead, i) => (
                <tr key={lead.id}
                  style={{ borderBottom: i < (data.data.length - 1) ? '1px solid var(--border-subtle)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="px-4 py-3">
                    <Link to={`/leads/${lead.id}`} className="text-[12.5px] font-medium hover:underline"
                      style={{ color: 'var(--text-primary)' }}>
                      {lead.contactName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                    {lead.companyName || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {lead.status && <Badge color={lead.status.color}>{lead.status.name}</Badge>}
                  </td>
                  <td className="px-4 py-3"><PriorityBadge priority={lead.priority} /></td>
                  <td className="px-4 py-3">
                    {lead.owner ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={lead.owner.fullName} size="xs" />
                        <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{lead.owner.fullName}</span>
                      </div>
                    ) : <span style={{ color: 'var(--text-disabled)' }}>—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-[12.5px] font-medium" style={{ color: 'var(--text-primary)' }}>
                    {lead.estimatedValue ? `₹${Number(lead.estimatedValue).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                    {lead.expectedCloseAt ? new Date(lead.expectedCloseAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/leads/${lead.id}`} className="text-[11.5px] hover:underline"
                      style={{ color: 'var(--text-tertiary)' }}>View</Link>
                  </td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                    No leads yet. Create your first lead →
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination page={page} total={data?.total || 0} limit={25} onChange={setPage} />
        </div>
      )}

      <NewLeadDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDefaultStatusId(null); }}
        defaultStatusId={defaultStatusId}
      />
    </PageLayout>
  );
}
