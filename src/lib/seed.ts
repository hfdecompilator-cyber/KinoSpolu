import { v4 as uuid } from 'uuid';
import type { Party, User, ServiceAuth, StreamingService, PartyMember, ChatMessage } from '@/types';
import { db } from './database';
import { SAMPLE_THUMBNAILS } from './constants';

const SEED_KEY = 'wp_seeded_v2';

function makeMember(user: User, isHost: boolean): PartyMember {
  return {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: null,
    joinedAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    isHost,
    isReady: true,
  };
}

function makeSystemMsg(partyId: string, content: string): ChatMessage {
  return {
    id: uuid(),
    partyId,
    userId: 'system',
    username: 'system',
    displayName: 'WatchParty',
    avatarUrl: null,
    content,
    type: 'system',
    createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
  };
}

function makeChatMsg(partyId: string, user: User, content: string): ChatMessage {
  return {
    id: uuid(),
    partyId,
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: null,
    content,
    type: 'text',
    createdAt: new Date(Date.now() - Math.random() * 1800000).toISOString(),
  };
}

function makeServices(connected: StreamingService[]): ServiceAuth[] {
  const all: StreamingService[] = ['netflix', 'youtube', 'spotify', 'twitch', 'prime', 'disney', 'hbo', 'apple', 'hulu', 'paramount'];
  return all.map((s) => ({
    service: s,
    connected: connected.includes(s),
    connectedAt: connected.includes(s) ? new Date(Date.now() - 86400000).toISOString() : null,
    username: connected.includes(s) ? 'user_' + s : null,
  }));
}

export function seedDemoData() {
  if (localStorage.getItem(SEED_KEY)) return;

  const demoUsers: User[] = [
    {
      id: uuid(), username: 'alexmovie', displayName: 'Alex Chen', email: 'alex@demo.com',
      avatarUrl: null, bio: 'Movie enthusiast', createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      connectedServices: makeServices(['netflix', 'youtube', 'disney', 'hbo']),
      friends: [], partiesHosted: 3, partiesJoined: 5,
    },
    {
      id: uuid(), username: 'jordanbeats', displayName: 'Jordan Williams', email: 'jordan@demo.com',
      avatarUrl: null, bio: 'Music & gaming', createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      connectedServices: makeServices(['spotify', 'twitch', 'youtube']),
      friends: [], partiesHosted: 2, partiesJoined: 8,
    },
    {
      id: uuid(), username: 'samstreams', displayName: 'Sam Rivera', email: 'sam@demo.com',
      avatarUrl: null, bio: 'Binge watcher', createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      connectedServices: makeServices(['netflix', 'prime', 'hulu', 'paramount']),
      friends: [], partiesHosted: 1, partiesJoined: 4,
    },
    {
      id: uuid(), username: 'taylorflix', displayName: 'Taylor Kim', email: 'taylor@demo.com',
      avatarUrl: null, bio: 'K-drama addict', createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      connectedServices: makeServices(['netflix', 'disney', 'apple']),
      friends: [], partiesHosted: 4, partiesJoined: 12,
    },
    {
      id: uuid(), username: 'caseyg', displayName: 'Casey Garcia', email: 'casey@demo.com',
      avatarUrl: null, bio: 'Horror fan', createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      connectedServices: makeServices(['hbo', 'prime', 'twitch', 'youtube']),
      friends: [], partiesHosted: 1, partiesJoined: 3,
    },
  ];

  demoUsers.forEach((u) => db.users.create(u));

  const partyConfigs: { host: number; service: StreamingService; name: string; content: string; members: number[]; tags: string[]; status: Party['status'] }[] = [
    { host: 0, service: 'netflix', name: 'Friday Movie Night: Inception', content: 'Inception (2010)', members: [2, 3], tags: ['Movie Night', 'Sci-Fi', 'Classic'], status: 'watching' },
    { host: 1, service: 'spotify', name: 'Lo-Fi Study Session', content: 'ChilledCow - Lo-Fi Hip Hop Radio', members: [4], tags: ['Music', 'Chill'], status: 'watching' },
    { host: 4, service: 'twitch', name: 'Gaming Marathon: GDQ Rerun', content: 'Games Done Quick Archive', members: [1], tags: ['Gaming', 'Late Night'], status: 'waiting' },
    { host: 3, service: 'disney', name: 'Marvel Movie Marathon', content: 'Avengers: Endgame', members: [0], tags: ['Movie Night', 'Action', 'Binge Watch'], status: 'waiting' },
    { host: 2, service: 'prime', name: 'The Boys Watch Party', content: 'The Boys S4E01', members: [], tags: ['Series Premiere', 'Action'], status: 'waiting' },
    { host: 0, service: 'hbo', name: 'House of the Dragon S3', content: 'House of the Dragon S3E01', members: [4], tags: ['Series Premiere', 'Binge Watch'], status: 'watching' },
    { host: 1, service: 'youtube', name: 'Tech News Roundup', content: 'MKBHD Latest', members: [0, 4], tags: ['Documentary', 'Chill'], status: 'waiting' },
    { host: 3, service: 'netflix', name: 'K-Drama Night: Squid Game', content: 'Squid Game S2', members: [0, 2], tags: ['K-Drama', 'Binge Watch', 'Late Night'], status: 'watching' },
  ];

  partyConfigs.forEach((cfg) => {
    const host = demoUsers[cfg.host];
    const partyId = uuid();
    const members: PartyMember[] = [makeMember(host, true)];
    const messages: ChatMessage[] = [makeSystemMsg(partyId, `${host.displayName} created the party.`)];

    cfg.members.forEach((mi) => {
      const member = demoUsers[mi];
      members.push(makeMember(member, false));
      messages.push(makeSystemMsg(partyId, `${member.displayName} joined the party!`));
    });

    if (members.length > 1) {
      messages.push(makeChatMsg(partyId, host, 'Welcome everyone! 🎉'));
      messages.push(makeChatMsg(partyId, demoUsers[cfg.members[0] ?? cfg.host], 'Excited to watch together!'));
    }

    const party: Party = {
      id: partyId,
      name: cfg.name,
      description: `Join us for ${cfg.content}!`,
      hostId: host.id,
      hostUsername: host.username,
      hostDisplayName: host.displayName,
      service: cfg.service,
      contentTitle: cfg.content,
      contentUrl: '',
      visibility: 'public',
      status: cfg.status,
      maxMembers: 10 + Math.floor(Math.random() * 40),
      members,
      messages,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date(Date.now() - Math.random() * 7200000).toISOString(),
      startedAt: cfg.status === 'watching' ? new Date(Date.now() - Math.random() * 3600000).toISOString() : null,
      endedAt: null,
      tags: cfg.tags,
      thumbnailUrl: SAMPLE_THUMBNAILS[Math.floor(Math.random() * SAMPLE_THUMBNAILS.length)],
    };

    db.parties.create(party);
  });

  localStorage.setItem(SEED_KEY, 'true');
}
