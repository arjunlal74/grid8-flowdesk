import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLead, archiveLead, getLeadComments, addLeadComment, getLeadActivity } from '../../api/leads.api.js';
import Badge, { PriorityBadge } from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import { Archive, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Comments', 'Activity'];

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState('Overview');
  const [comment, setComment] = useState('');

  const { data: lead, isLoading } = useQuery({ queryKey: ['lead', id], queryFn: () => getLead(id) });
  const { data: comments } = useQuery({ queryKey: ['lead-comments', id], queryFn: () => getLeadComments(id), enabled: tab === 'Comments' });
  const { data: activity } = useQuery({ queryKey: ['lead-activity', id], queryFn: () => getLeadActivity(id), enabled: tab === 'Activity' });

  const { mutate: doArchive } = useMutation({
    mutationFn: () => archiveLead(id),
    onSuccess: () => { toast.success('Lead archived'); qc.invalidateQueries({ queryKey: ['lead', id] }); },
  });

  const { mutate: submitComment, isPending: submitting } = useMutation({
    mutationFn: () => addLeadComment(id, comment),
    onSuccess: () => { setComment(''); qc.invalidateQueries({ queryKey: ['lead-comments', id] }); },
  });

  if (isLoading) return <div className="p-6 text-text-tertiary text-[13px]">Loading…</div>;
  if (!lead) return <div className="p-6 text-danger text-[13px]">Lead not found</div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/leads')} className="text-text-tertiary hover:text-text-primary text-[13px]">← Leads</button>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-8 space-y-4">
          <div className="bg-bg-surface border rounded-card p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-[22px] font-semibold text-text-primary">{lead.contactName}</h1>
                {lead.companyName && <p className="text-[14px] text-text-secondary mt-0.5">{lead.companyName}</p>}
                <div className="flex items-center gap-2 mt-2">
                  {lead.status && <Badge color={lead.status.color}>{lead.status.name}</Badge>}
                  <PriorityBadge priority={lead.priority} />
                  {lead.isArchived && <Badge className="bg-danger/10 text-danger">Archived</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => doArchive()}>
                  <Archive size={13} /> {lead.isArchived ? 'Restore' : 'Archive'}
                </Button>
              </div>
            </div>

            <div className="flex gap-1 border-b border mb-4">
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                    tab === t ? 'border-white text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === 'Overview' && (
              <div className="grid grid-cols-2 gap-4 text-[13px]">
                {[
                  ['Email', lead.email],
                  ['Phone', lead.phone],
                  ['WhatsApp', lead.whatsapp],
                  ['Website', lead.website],
                  ['City', lead.city],
                  ['Country', lead.country],
                  ['Source', lead.source?.replace('_', ' ')],
                  ['Currency', lead.currency],
                ].map(([k, v]) => v ? (
                  <div key={k}>
                    <p className="text-text-tertiary text-[11px] mb-0.5">{k}</p>
                    <p className="text-text-primary">{v}</p>
                  </div>
                ) : null)}
                {lead.description && (
                  <div className="col-span-2">
                    <p className="text-text-tertiary text-[11px] mb-0.5">Notes</p>
                    <p className="text-text-primary whitespace-pre-wrap">{lead.description}</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'Comments' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {comments?.map(c => (
                    <div key={c.id} className="flex items-start gap-3">
                      <Avatar name={c.author.fullName} size="sm" />
                      <div className="flex-1 bg-bg-surface-2 rounded-card p-3">
                        <p className="text-[12px] font-medium text-text-primary mb-1">{c.author.fullName}</p>
                        <p className="text-[13px] text-text-secondary whitespace-pre-wrap">{c.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Add a comment…"
                    rows={3}
                    className="flex-1 bg-bg-surface-2 border rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder-text-disabled focus:outline-none focus:border-border-strong resize-none"
                  />
                  <Button onClick={() => submitComment()} disabled={!comment.trim() || submitting} variant="secondary" size="sm">
                    <Send size={13} />
                  </Button>
                </div>
              </div>
            )}

            {tab === 'Activity' && (
              <div className="space-y-3">
                {activity?.map(log => (
                  <div key={log.id} className="flex items-start gap-3 py-2 border-b border-subtle last:border-0">
                    <Avatar name={log.actor.fullName} size="sm" />
                    <div>
                      <p className="text-[13px] text-text-primary">
                        <span className="font-medium">{log.actor.fullName}</span>{' '}
                        <span className="text-text-secondary">{log.action}</span>
                      </p>
                      <p className="text-[11px] text-text-tertiary">{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {!activity?.length && <p className="text-[13px] text-text-tertiary">No activity yet</p>}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-4 space-y-4">
          <div className="bg-bg-surface border rounded-card p-5 space-y-3 text-[13px]">
            <h3 className="text-[14px] font-semibold text-text-primary mb-3">Quick Info</h3>
            {[
              ['Owner', lead.owner?.fullName],
              ['Category', lead.category?.name],
              ['Est. Value', lead.estimatedValue ? `₹${Number(lead.estimatedValue).toLocaleString('en-IN')}` : null],
              ['Expected Close', lead.expectedCloseAt ? new Date(lead.expectedCloseAt).toLocaleDateString('en-IN') : null],
              ['Created', new Date(lead.createdAt).toLocaleDateString('en-IN')],
            ].map(([k, v]) => v ? (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-text-tertiary">{k}</span>
                <span className="text-text-primary font-medium text-right">{v}</span>
              </div>
            ) : null)}
            {lead.tags?.length > 0 && (
              <div>
                <p className="text-text-tertiary mb-1.5">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {lead.tags.map(lt => (
                    <Badge key={lt.tagId} color={lt.tag.color}>{lt.tag.name}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
