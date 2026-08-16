import React, { useEffect, useMemo, useState } from 'react';
import type { SupportTicket, SupportTicketPriority, SupportTicketStatus, ToastMessage, UserProfile } from '../types';
import { apiClient } from '../hooks/useAPI';
import Card from './ui/Card';
import Button from './ui/Button';

type SupportCenterProps = { profile: UserProfile; setToast: (toast: ToastMessage | null) => void };

const statusLabels: Record<SupportTicketStatus, string> = {
  OPEN: 'Open', IN_PROGRESS: 'In progress', WAITING_FOR_USER: 'Awaiting your reply', RESOLVED: 'Resolved', CLOSED: 'Closed'
};

const priorityClasses: Record<SupportTicketPriority, string> = {
  LOW: 'text-slate-500 bg-slate-500/10', NORMAL: 'text-blue-600 bg-blue-500/10', HIGH: 'text-amber-600 bg-amber-500/10', URGENT: 'text-rose-600 bg-rose-500/10'
};

const SupportCenter: React.FC<SupportCenterProps> = ({ profile, setToast }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('ACCOUNT');
  const [priority, setPriority] = useState<SupportTicketPriority>('NORMAL');
  const [reply, setReply] = useState('');

  const loadTickets = async () => {
    try {
      const all = await apiClient.getAllSupportTickets();
      const own = all.filter(ticket => ticket.userId === profile.id);
      setTickets(own);
      if (!selectedId && own[0]) setSelectedId(own[0].id);
    } catch (error) {
      console.error(error);
      setToast({ type: 'error', text: 'Support tickets could not be loaded.' });
    }
  };

  useEffect(() => { loadTickets(); }, [profile.id]);

  const selectedTicket = useMemo(() => tickets.find(ticket => ticket.id === selectedId) || null, [tickets, selectedId]);

  const submitTicket = async () => {
    if (!subject.trim() || !message.trim()) return;
    try {
      const ticket = await apiClient.createSupportTicket({
        userId: profile.id,
        userName: profile.name,
        userEmail: profile.email || '',
        subject: subject.trim(),
        category,
        priority,
        status: 'OPEN'
      }, message.trim());
      setTickets(current => [ticket, ...current]);
      setSelectedId(ticket.id);
      setSubject(''); setMessage(''); setIsCreating(false);
      setToast({ type: 'success', text: 'Support ticket submitted.' });
    } catch (error) {
      console.error(error);
      setToast({ type: 'error', text: 'Ticket submission failed.' });
    }
  };

  const sendReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    try {
      const nextMessage = await apiClient.addSupportTicketMessage(selectedTicket.id, { senderId: profile.id, senderName: profile.name, senderRole: 'USER', text: reply.trim() });
      setTickets(current => current.map(ticket => ticket.id === selectedTicket.id ? { ...ticket, status: 'OPEN', updatedAt: Date.now(), messages: [...ticket.messages, nextMessage] } : ticket));
      setReply('');
      setToast({ type: 'success', text: 'Reply sent to support.' });
    } catch (error) {
      console.error(error);
      setToast({ type: 'error', text: 'Reply could not be sent.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">Client Services</p>
          <h2 className="text-3xl font-black text-text-strong">Support Center</h2>
          <p className="text-sm text-base-content/65 mt-1">Open a case, follow responses, and keep your trading questions in one place.</p>
        </div>
        <Button onClick={() => setIsCreating(value => !value)}>{isCreating ? 'Close form' : 'New support ticket'}</Button>
      </div>

      {isCreating && (
        <Card className="border-blue-500/20">
          <h3 className="text-lg font-bold text-text-strong mb-4">Create a support case</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input className="input input-bordered bg-base-100 md:col-span-2" placeholder="Subject" value={subject} onChange={event => setSubject(event.target.value)} />
            <select className="select select-bordered bg-base-100" value={category} onChange={event => setCategory(event.target.value as SupportTicket['category'])}>
              <option value="ACCOUNT">Account</option><option value="TRADING">Trading</option><option value="PORTFOLIO">Portfolio</option><option value="TECHNICAL">Technical</option><option value="OTHER">Other</option>
            </select>
            <select className="select select-bordered bg-base-100" value={priority} onChange={event => setPriority(event.target.value as SupportTicketPriority)}>
              <option value="LOW">Low priority</option><option value="NORMAL">Normal priority</option><option value="HIGH">High priority</option><option value="URGENT">Urgent</option>
            </select>
            <textarea className="textarea textarea-bordered bg-base-100 md:col-span-2 min-h-28" placeholder="Describe the issue or request" value={message} onChange={event => setMessage(event.target.value)} />
          </div>
          <div className="flex justify-end mt-4"><Button onClick={submitTicket} disabled={!subject.trim() || !message.trim()}>Submit ticket</Button></div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.5fr)] gap-6">
        <Card className="!p-0 overflow-hidden">
          <div className="p-4 border-b border-base-300 flex items-center justify-between"><h3 className="font-bold text-text-strong">My tickets</h3><span className="badge badge-ghost">{tickets.length}</span></div>
          <div className="divide-y divide-base-300 max-h-[32rem] overflow-y-auto">
            {tickets.length === 0 && <div className="p-6 text-sm text-base-content/60">No support tickets yet.</div>}
            {tickets.map(ticket => (
              <button key={ticket.id} onClick={() => setSelectedId(ticket.id)} className={`w-full text-left p-4 hover:bg-base-200/60 transition-colors ${selectedId === ticket.id ? 'bg-blue-500/10 border-l-4 border-blue-600' : ''}`}>
                <div className="flex items-start justify-between gap-3"><p className="font-semibold text-text-strong line-clamp-2">{ticket.subject}</p><span className={`text-[10px] font-bold rounded px-2 py-1 whitespace-nowrap ${priorityClasses[ticket.priority]}`}>{ticket.priority}</span></div>
                <p className="text-xs text-base-content/60 mt-2">{statusLabels[ticket.status]} · {new Date(ticket.updatedAt).toLocaleDateString()}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          {!selectedTicket ? <div className="min-h-64 flex items-center justify-center text-sm text-base-content/60">Select a ticket to view the conversation.</div> : <>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-base-300 pb-4"><div><p className="text-xs uppercase tracking-widest text-base-content/50">{selectedTicket.category}</p><h3 className="text-xl font-bold text-text-strong">{selectedTicket.subject}</h3></div><span className="badge badge-outline">{statusLabels[selectedTicket.status]}</span></div>
            <div className="space-y-4 py-5 max-h-[24rem] overflow-y-auto">{selectedTicket.messages.map(item => <div key={item.id} className={`rounded-2xl p-4 ${item.senderRole === 'USER' ? 'bg-blue-500/10 ml-8' : 'bg-base-200 mr-8'}`}><div className="flex justify-between text-xs text-base-content/55"><span className="font-semibold">{item.senderName}</span><span>{new Date(item.createdAt).toLocaleString()}</span></div><p className="mt-2 text-sm whitespace-pre-wrap text-text-strong">{item.text}</p></div>)}</div>
            {selectedTicket.status !== 'CLOSED' && <div className="flex gap-3 border-t border-base-300 pt-4"><textarea className="textarea textarea-bordered bg-base-100 flex-1" rows={2} placeholder="Reply to support" value={reply} onChange={event => setReply(event.target.value)} /><Button onClick={sendReply} disabled={!reply.trim()}>Reply</Button></div>}
          </>}
        </Card>
      </div>
    </div>
  );
};

export default SupportCenter;
