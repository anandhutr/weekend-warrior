import Dexie, { Table } from 'dexie';
import { Player, Team } from './types';
import { INITIAL_PLAYERS, INITIAL_TEAMS } from './constants';

export class CricAuctionDB extends Dexie {
  players!: Table<Player>;
  teams!: Table<Team>;

  constructor() {
    super('CricAuctionDB');
    this.version(1).stores({
      players: 'id, name, role, country, status, teamId',
      teams: 'id, name, owner'
    });
  }
}

export const db = new CricAuctionDB();

const loadFromJSON = async () => {
  let playersLoaded = false;
  let teamsLoaded = false;

  try {
    const playersResponse = await fetch('/players.json');
    if (playersResponse.ok) {
      const playersData = await playersResponse.json();
      if (Array.isArray(playersData)) {
        await db.players.bulkAdd(playersData);
        playersLoaded = true;
      }
    }
  } catch (e) { /* Ignore */ }

  try {
    const teamsResponse = await fetch('/teams.json');
    if (teamsResponse.ok) {
      const teamsData = await teamsResponse.json();
      if (Array.isArray(teamsData)) {
        await db.teams.bulkAdd(teamsData);
        teamsLoaded = true;
      }
    }
  } catch (e) { /* Ignore */ }

  if (!playersLoaded) {
    await db.players.bulkAdd(INITIAL_PLAYERS);
  }
  if (!teamsLoaded) {
    await db.teams.bulkAdd(INITIAL_TEAMS);
  }
};

export const resetDatabase = async () => {
  await db.transaction('rw', db.players, db.teams, async () => {
    await db.players.clear();
    await db.teams.clear();
    await loadFromJSON();
  });
};

db.on('populate', async () => {
  await loadFromJSON();
});
