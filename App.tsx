
import React, { useState, useCallback, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, resetDatabase } from './db';
import { Player, Team, PlayerStatus } from './types';
import AuctionArena from './components/AuctionArena';
import Dashboard from './components/Dashboard';
import TeamList from './components/TeamList';
import PlayerPool from './components/PlayerPool';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const isProduction = import.meta.env.PROD;
  const [activeTab, setActiveTab] = useState<'dashboard' | 'arena' | 'teams' | 'players'>('dashboard');
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  // Local DB State (Development)
  const localTeams = useLiveQuery(() => db.teams.toArray()) || [];
  const localPlayers = useLiveQuery(() => db.players.toArray()) || [];

  // API State (Production)
  const [apiTeams, setApiTeams] = useState<Team[]>([]);
  const [apiPlayers, setApiPlayers] = useState<Player[]>([]);

  // Unified State
  const teams = isProduction ? apiTeams : localTeams;
  const players = isProduction ? apiPlayers : localPlayers;

  const fetchData = async () => {
    if (!isProduction) return; // Skip API fetch in dev
    try {
      const [playersRes, teamsRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/teams')
      ]);
      if (playersRes.ok && teamsRes.ok) {
        setApiPlayers(await playersRes.json());
        setApiTeams(await teamsRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch data from API:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBidding = useCallback(async (playerId: string, teamId: string, bidAmount: number) => {
    const player = players.find(p => p.id === playerId);
    const team = teams.find(t => t.id === teamId);

    if (player && team) {
      const updatedPlayer = { ...player, status: PlayerStatus.SOLD, soldPrice: bidAmount, teamId: teamId };
      const updatedTeam = { ...team, budget: team.budget - bidAmount, players: [...team.players, playerId] };

      if (isProduction) {
        await Promise.all([
          fetch('/api/players', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedPlayer) }),
          fetch('/api/teams', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedTeam) })
        ]);
        fetchData();
      } else {
        await db.transaction('rw', db.players, db.teams, async () => {
          await db.players.update(playerId, { status: PlayerStatus.SOLD, soldPrice: bidAmount, teamId: teamId });
          await db.teams.update(teamId, { budget: team.budget - bidAmount, players: [...team.players, playerId] });
        });
      }
    }
  }, [players, teams, isProduction]);

  const handleUnsold = useCallback(async (playerId: string) => {
    if (isProduction) {
      const player = players.find(p => p.id === playerId);
      if (player) {
        await fetch('/api/players', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...player, status: PlayerStatus.UNSOLD }) });
        fetchData();
      }
    } else {
      await db.players.update(playerId, { status: PlayerStatus.UNSOLD });
    }
  }, [players, isProduction]);

  const addPlayer = async (newPlayer: Player) => {
    if (isProduction) {
      await fetch('/api/players', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPlayer) });
      fetchData();
    } else {
      await db.players.add(newPlayer);
    }
  };

  const updatePlayer = async (updatedPlayer: Player) => {
    if (isProduction) {
      await fetch('/api/players', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedPlayer) });
      fetchData();
    } else {
      await db.players.put(updatedPlayer);
    }
  };

  const deletePlayer = async (playerId: string) => {
    if (isProduction) {
      await fetch(`/api/players?id=${playerId}`, { method: 'DELETE' });
      fetchData();
    } else {
      await deletePlayers([playerId]);
    }
  };

  const deletePlayers = async (playerIds: string[]) => {
    if (isProduction) {
      await Promise.all(playerIds.map(id => fetch(`/api/players?id=${id}`, { method: 'DELETE' })));
      fetchData();
    } else {
      await db.transaction('rw', db.players, db.teams, async () => {
        const playersToDelete = await db.players.bulkGet(playerIds);
        for (const p of playersToDelete) {
          if (p && p.teamId && p.soldPrice) {
            const team = await db.teams.get(p.teamId);
            if (team) {
              await db.teams.update(team.id, {
                budget: team.budget + p.soldPrice,
                players: team.players.filter(id => id !== p.id)
              });
            }
          }
        }
        await db.players.bulkDelete(playerIds);
      });
    }
  };

  const deleteAllPlayers = async () => {
    if (isProduction) {
      // In production, we'd ideally have a bulk delete endpoint, but iterating is safer for now
      await Promise.all(players.map(p => fetch(`/api/players?id=${p.id}`, { method: 'DELETE' })));
      fetchData();
    } else {
      await db.transaction('rw', db.players, db.teams, async () => {
        const allTeams = await db.teams.toArray();
        for (const team of allTeams) {
          await db.teams.update(team.id, { players: [], budget: team.maxBudget });
        }
        await db.players.clear();
      });
    }
  };

  const addTeam = async (name: string, owner: string, iconPlayer: string, budget: number) => {
    const newTeam: Team = {
      id: `t${Date.now()}`,
      name,
      owner,
      iconPlayer,
      budget,
      maxBudget: budget,
      players: [],
      color: 'bg-emerald-600'
    };
    if (isProduction) {
      await fetch('/api/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTeam) });
      fetchData();
    } else {
      await db.teams.add(newTeam);
    }
  };

  const updateTeam = async (updatedTeam: Team) => {
    if (isProduction) {
      await fetch('/api/teams', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedTeam) });
      fetchData();
    } else {
      await db.teams.put(updatedTeam);
    }
  };

  const deleteTeam = async (teamId: string) => {
    if (isProduction) {
      await fetch(`/api/teams?id=${teamId}`, { method: 'DELETE' });
      fetchData();
    } else {
      await db.transaction('rw', db.players, db.teams, async () => {
        await db.players.where('teamId').equals(teamId).modify({
          status: PlayerStatus.AVAILABLE,
          teamId: undefined,
          soldPrice: undefined
        });
        await db.teams.delete(teamId);
      });
    }
  };

  const deleteAllTeams = async () => {
    if (isProduction) {
      await Promise.all(teams.map(t => fetch(`/api/teams?id=${t.id}`, { method: 'DELETE' })));
      fetchData();
    } else {
      await db.transaction('rw', db.players, db.teams, async () => {
        const allTeamIds = await db.teams.toCollection().keys();
        await db.players.where('teamId').anyOf(allTeamIds).modify({
          status: PlayerStatus.AVAILABLE,
          teamId: undefined,
          soldPrice: undefined
        });
        await db.teams.clear();
      });
    }
  };

  const executeReset = async () => {
    if (isProduction) {
      const confirmed = window.confirm("This will delete ALL players and teams from the database. Are you sure?");
      if (confirmed) {
          await deleteAllPlayers();
          await deleteAllTeams();
          fetchData();
      }
    } else {
      try {
        await resetDatabase();
      } catch (error) {
        console.error("Failed to reset database:", error);
      }
    }
    setShowResetConfirmation(false);
    setActiveTab('dashboard');
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="mb-8 flex justify-between items-center border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-bebas tracking-wider text-white">CricAuction <span className="text-emerald-500">Pro</span></h1>
            <p className="text-slate-400 text-sm">Professional Cricket Auction Management Suite</p>
          </div>
          <div className="flex items-center gap-6">
             <button
                onClick={() => setShowResetConfirmation(true)}
                className="text-[10px] font-bold text-slate-500 hover:text-red-400 uppercase tracking-[0.2em] transition-colors border border-slate-800 px-3 py-1.5 rounded-lg"
             >
               Reset DB
             </button>
             <div className="text-right hidden sm:block border-r border-slate-800 pr-6">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Total Teams</p>
                <p className="text-2xl font-bebas text-white leading-none">{teams.length}</p>
             </div>
             <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Live Pool</p>
                <p className="text-2xl font-bebas text-emerald-500 leading-none">{players.filter(p => p.status === PlayerStatus.AVAILABLE).length}</p>
             </div>
          </div>
        </header>

        {activeTab === 'dashboard' && <Dashboard teams={teams} players={players} />}

        {activeTab === 'arena' && (
          <AuctionArena 
            players={players.filter(p => p.status === PlayerStatus.AVAILABLE)}
            teams={teams}
            onSold={handleBidding}
            onUnsold={handleUnsold}
          />
        )}

        {activeTab === 'teams' && (
          <TeamList 
            teams={teams} 
            players={players} 
            onAddTeam={addTeam}
            onUpdateTeam={updateTeam}
            onDeleteTeam={deleteTeam}
            onDeleteAllTeams={deleteAllTeams}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'players' && (
          <PlayerPool 
            players={players} 
            onAddPlayer={addPlayer}
            onUpdatePlayer={updatePlayer}
            onDeletePlayer={deletePlayer}
            onDeletePlayers={deletePlayers}
            onDeleteAllPlayers={deleteAllPlayers}
            onRefresh={fetchData}
          />
        )}
      </main>

      {/* Reset Confirmation Modal */}
      {showResetConfirmation && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-[2.5rem] border border-red-500/30 p-10 shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-3xl font-bebas text-white mb-3 tracking-widest uppercase text-red-500">Master Reset</h3>
            <p className="text-slate-400 text-sm mb-10 leading-relaxed">
              This action will permanently delete all custom players, teams, and auction data. The system will return to its default state.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={executeReset}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all"
              >
                WIPE ALL DATA
              </button>
              <button
                onClick={() => setShowResetConfirmation(false)}
                className="w-full py-4 bg-slate-800 text-slate-400 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-700 transition-all"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
