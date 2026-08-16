import React, { useEffect, useState } from 'react';
import type { Competition, UserProfile } from '../types';
import { apiClient } from '../hooks/useAPI';
import Card from './ui/Card';
import Button from './ui/Button';

type CompetitionsViewProps = { profile: UserProfile; setToast: (toast: { type: 'success' | 'error' | 'info'; text: string } | null) => void };

const CompetitionsView: React.FC<CompetitionsViewProps> = ({ profile, setToast }) => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [inviteCode, setInviteCode] = useState('');

  const load = async () => {
    try { setCompetitions(await apiClient.getAllCompetitions()); }
    catch (error) { console.error(error); setToast({ type: 'error', text: 'Competitions could not be loaded.' }); }
  };
  useEffect(() => { load(); }, []);

  const join = async () => {
    if (!inviteCode.trim()) return;
    try { await apiClient.acceptCompetitionInvite(profile.id, inviteCode.trim().toUpperCase()); setInviteCode(''); await load(); setToast({ type: 'success', text: 'You joined the competition.' }); }
    catch (error: any) { setToast({ type: 'error', text: error?.message || 'Could not join competition.' }); }
  };

  const visible = competitions.filter(item => ['INVITE_ONLY', 'OPEN', 'RUNNING', 'PAUSED'].includes(item.status));
  return <div className="space-y-6"><div className="flex flex-col md:flex-row md:items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-violet-600">Market Challenges</p><h2 className="text-3xl font-black text-text-strong">Competitions</h2><p className="text-sm text-base-content/65 mt-1">Join a structured market challenge and track your performance against other participants.</p></div><div className="flex gap-2"><input className="input input-bordered bg-base-100" placeholder="Enter invite code" value={inviteCode} onChange={event => setInviteCode(event.target.value)} /><Button onClick={join} disabled={!inviteCode.trim()}>Join</Button></div></div><div className="grid grid-cols-1 xl:grid-cols-2 gap-5">{visible.map(item => { const joined = item.participantIds?.includes(profile.id); return <Card key={item.id} className={joined ? 'border-emerald-500/30' : ''}><div className="flex justify-between gap-3"><div><h3 className="text-xl font-bold text-text-strong">{item.name}</h3><p className="text-sm text-base-content/60 mt-1">{item.description || 'No description provided.'}</p></div><span className="badge badge-outline">{item.status.replaceAll('_', ' ')}</span></div><div className="grid grid-cols-2 gap-4 mt-5 text-sm"><div><p className="text-base-content/55">Participants</p><p className="font-bold">{item.participantIds?.length || 0} / {item.maxParticipants}</p></div><div><p className="text-base-content/55">Scoring</p><p className="font-bold">{item.scoring === 'TOTAL_RETURN' ? 'Total return' : 'Net worth'}</p></div><div><p className="text-base-content/55">Starts</p><p>{new Date(item.startAt).toLocaleString()}</p></div><div><p className="text-base-content/55">Ends</p><p>{new Date(item.endAt).toLocaleString()}</p></div></div><div className="mt-5 flex items-center justify-between"><span className="font-mono text-xs tracking-widest text-violet-600">{item.inviteCode}</span>{joined ? <span className="text-sm font-bold text-emerald-600">Joined</span> : <span className="text-xs text-base-content/55">Use the invite code to join</span>}</div></Card>; })}{visible.length === 0 && <Card><p className="text-sm text-base-content/55">No active competitions are available yet.</p></Card>}</div></div>;
};

export default CompetitionsView;
