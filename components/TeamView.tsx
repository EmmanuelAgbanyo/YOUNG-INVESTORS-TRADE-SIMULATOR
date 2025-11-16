import React, { useState, useEffect, useMemo } from 'react';
import type { UserProfile, Team, TeamInvite, OrderHistoryItem } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';

interface TeamViewProps {
    profile: UserProfile;
    orderHistory: OrderHistoryItem[];
}

const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962A3.75 3.75 0 0115 12a3.75 3.75 0 01-2.25 3.512m-3.75 1.488A2.25 2.25 0 016.75 18v-2.25m0 0a3.75 3.75 0 01-3.75-3.75m3.75 3.75A3.75 3.75 0 016 16.5m-3 3.75a3.75 3.75 0 01-3.75-3.75m0 0A3.75 3.75 0 013 12.75m3.75 1.488A3.75 3.75 0 019 15.25m-3.75 1.488a3.75 3.75 0 01-3.75-3.75m3.75 3.75c-1.33 0-2.51-.54-3.375-1.417-1.146-1.146-1.146-3.033 0-4.179 1.146-1.146 3.033-1.146 4.179 0 1.146 1.146 1.146 3.033 0 4.179Z" />
    </svg>
);

const ClipboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
  </svg>
);


const TeamView: React.FC<TeamViewProps> = ({ profile, orderHistory }) => {
    const [team, setTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [inviteCode, setInviteCode] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const formatter = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' });

    useEffect(() => {
        if (profile.teamId) {
            const allTeams: Team[] = JSON.parse(localStorage.getItem('yin_trade_teams') || '[]');
            const currentTeam = allTeams.find(t => t.id === profile.teamId);
            setTeam(currentTeam || null);

            if (currentTeam) {
                const allProfiles: UserProfile[] = JSON.parse(localStorage.getItem('yin_trade_profiles') || '[]');
                const teamMembers = allProfiles.filter(p => currentTeam.memberIds.includes(p.id));
                setMembers(teamMembers);

                const allInvites: TeamInvite[] = JSON.parse(localStorage.getItem('yin_trade_invites') || '[]');
                const currentInvite = allInvites.find(i => i.teamId === currentTeam.id);
                setInviteCode(currentInvite?.code || 'No code found');
            }
        }
    }, [profile.teamId]);

    const memberPerformance = useMemo(() => {
        const performance: Record<string, { name: string, pnl: number, tradeCount: number }> = {};
        members.forEach(m => {
            performance[m.id] = { name: m.name, pnl: 0, tradeCount: 0 };
        });

        orderHistory.forEach(order => {
            if (order.finalStatus === 'EXECUTED' && order.total && performance[order.traderId]) {
                 performance[order.traderId].tradeCount += 1;
                 const pnl = order.tradeType === 'SELL' ? order.total : -order.total; // Simplified PnL
                 performance[order.traderId].pnl += pnl;
            }
        });
        
        return Object.values(performance).sort((a, b) => b.pnl - a.pnl);

    }, [members, orderHistory]);


    const handleCopy = () => {
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!team) {
        return <Card><p>You are not part of a team.</p></Card>;
    }

    const leader = members.find(m => m.id === team.leaderId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <div className="flex items-center space-x-3 mb-4">
                        <UsersIcon className="w-6 h-6 text-primary" />
                        <h3 className="text-xl font-bold text-text-strong">Team Details</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Team Name:</span>
                            <span className="font-semibold text-text-strong">{team.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Leader:</span>
                            <span className="font-semibold text-text-strong">{leader?.name || '...'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Members:</span>
                            <span className="font-semibold text-text-strong">{members.length}</span>
                        </div>
                    </div>
                </Card>
                {profile.isTeamLeader && (
                    <Card>
                        <h3 className="text-lg font-bold text-text-strong mb-2">Invite Members</h3>
                        <p className="text-sm text-base-content/80 mb-4">Share this code with others to let them join your team.</p>
                        <div className="flex items-center space-x-2">
                             <input type="text" readOnly value={inviteCode} className="input input-bordered w-full bg-base-100 font-mono" />
                             <Button onClick={handleCopy} className="!p-3">
                                <ClipboardIcon className="w-5 h-5" />
                             </Button>
                        </div>
                        {copied && <p className="text-success text-xs text-center mt-2">Copied to clipboard!</p>}
                    </Card>
                )}
            </div>

            <div className="lg:col-span-2">
                <Card>
                    <h3 className="text-xl font-bold text-text-strong mb-4">Member Leaderboard</h3>
                     <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr className="border-b border-base-300">
                                    <th className="text-left bg-transparent text-base-content font-semibold p-4">Rank</th>
                                    <th className="text-left bg-transparent text-base-content font-semibold p-4">Member Name</th>
                                    <th className="text-right bg-transparent text-base-content font-semibold p-4">Trades Made</th>
                                    <th className="text-right bg-transparent text-base-content font-semibold p-4">P/L Contribution</th>
                                </tr>
                            </thead>
                            <tbody>
                                {memberPerformance.map((member, index) => (
                                    <tr key={member.name} className={`border-b border-base-300/50 last:border-b-0 ${index % 2 === 0 ? 'bg-base-200/30' : ''}`}>
                                        <td className="p-4 font-bold text-text-strong text-lg">#{index + 1}</td>
                                        <td className="p-4 font-semibold text-text-strong">{member.name}</td>
                                        <td className="p-4 text-right font-mono">{member.tradeCount}</td>
                                        <td className={`p-4 text-right font-mono ${member.pnl >= 0 ? 'text-success' : 'text-error'}`}>
                                            {formatter.format(member.pnl)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default TeamView;
