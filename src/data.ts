export const topics = ['All tweets', 'AI agents', 'Digital identity', 'Building', 'Memes'] as const;
export type Topic = (typeof topics)[number];
export type View = 'top' | 'latest' | 'saved';
export type Sort = 'engagement' | 'newest' | 'likes';

export interface Tweet {
  id: string;
  name: string;
  handle: string;
  avatar: 'frog' | 'pixel' | 'orb' | 'terminal' | 'flower' | 'bolt';
  hoursAgo: number;
  text: string;
  tags: string[];
  topic: Exclude<Topic, 'All tweets'>;
  likes: number;
  reposts: number;
  replies: number;
  views: number;
  media?: 'identity' | 'pepe' | 'code';
}

// Original fictional examples, not scraped posts or endorsements. No real status IDs.
export const tweets: Tweet[] = [
  { id: 'signal-01', name: 'Pepe with a plan', handle: '@pepewithaplan_demo', avatar: 'frog', hoursAgo: 2,
    text: 'Your AI knows everything about the internet.\nIt should know a little more about you.\n\nOne identity. Every agent. That’s the idea behind identity.md.',
    tags: ['IdentityMD', 'DigitalIdentity'], topic: 'Digital identity', likes: 1240, reposts: 286, replies: 84, views: 42800, media: 'identity' },
  { id: 'signal-02', name: 'neural fren', handle: '@neuralfren_demo', avatar: 'pixel', hoursAgo: 4,
    text: 'me: just one more AI tool\n\nalso me: gives my entire agent squad a shared identity.md so they finally understand the assignment',
    tags: ['IdentityMD', 'AIAgents'], topic: 'Memes', likes: 986, reposts: 214, replies: 62, views: 31600, media: 'pepe' },
  { id: 'signal-03', name: 'the context window', handle: '@contextwindow_demo', avatar: 'orb', hoursAgo: 1,
    text: 'The best AI upgrade might not be a bigger model.\n\nIt might be a small, portable file that says who you are, how you work, and what matters to you.\n\nLess re-explaining. More building.',
    tags: ['IdentityMD', 'AIAgents'], topic: 'AI agents', likes: 842, reposts: 178, replies: 47, views: 25400 },
  { id: 'signal-04', name: 'ship it, fren', handle: '@shipitfren_demo', avatar: 'terminal', hoursAgo: 6,
    text: 'Today’s tiny experiment: wrote my working preferences in identity.md and brought them into a new agent session.\n\nThe first prompt was finally about the work. Not about introducing myself. Again.',
    tags: ['IdentityMD', 'BuildInPublic'], topic: 'Building', likes: 628, reposts: 112, replies: 38, views: 18200, media: 'code' },
  { id: 'signal-05', name: 'garden of agents', handle: '@agentgarden_demo', avatar: 'flower', hoursAgo: 12,
    text: 'A little reminder for the agent era:\n\nYour context is yours. Your preferences are yours. Your identity should travel with you.\n\nRooting for an internet that remembers the human.',
    tags: ['IdentityMD', 'DigitalIdentity'], topic: 'Digital identity', likes: 514, reposts: 93, replies: 29, views: 14600 },
  { id: 'signal-06', name: 'based on context', handle: '@basedoncontext_demo', avatar: 'bolt', hoursAgo: 18,
    text: 'Agents without context: “How can I help you today?”\n\nAgents with identity.md: “I made it dark green. Obviously.”\n\nThe future is personal. And a little bit pepe.',
    tags: ['IdentityMD', 'Pepe'], topic: 'Memes', likes: 472, reposts: 86, replies: 31, views: 12900 },
  { id: 'signal-07', name: 'neural fren', handle: '@neuralfren_demo', avatar: 'pixel', hoursAgo: 30,
    text: 'Thinking about what makes a useful identity file:\n\n→ Preferences, not passwords\n→ Context, not your whole life\n→ Easy to read, easy to edit\n\nSmall files. Better conversations.',
    tags: ['IdentityMD', 'AIAgents'], topic: 'AI agents', likes: 358, reposts: 72, replies: 24, views: 10100 },
  { id: 'signal-08', name: 'ship it, fren', handle: '@shipitfren_demo', avatar: 'terminal', hoursAgo: 48,
    text: 'Weekend build idea: an identity.md editor with a preview of exactly what an agent sees.\n\nReadable by humans. Useful to machines. No mystery in the middle.\n\nWho else is experimenting?',
    tags: ['IdentityMD', 'BuildInPublic'], topic: 'Building', likes: 291, reposts: 54, replies: 42, views: 8300 },
  { id: 'signal-09', name: 'the context window', handle: '@contextwindow_demo', avatar: 'orb', hoursAgo: 96,
    text: 'Personalization works better when you can see and edit the context.\n\nAn identity.md file makes that conversation tangible: this is me, these are my preferences, let’s build from here.',
    tags: ['IdentityMD', 'DigitalIdentity'], topic: 'Digital identity', likes: 204, reposts: 39, replies: 18, views: 6200 },
];

export function selectTweets({ view, query, topic, period, sort, saved }: {
  view: View; query: string; topic: Topic; period: string; sort: Sort; saved: string[];
}) {
  const q = query.trim().toLowerCase();
  return tweets.filter(tweet =>
    (view !== 'saved' || saved.includes(tweet.id)) &&
    (topic === 'All tweets' || topic === tweet.topic) &&
    (period !== '24h' || tweet.hoursAgo <= 24) &&
    (period !== '7d' || tweet.hoursAgo <= 168) &&
    (!q || `${tweet.text} ${tweet.name} ${tweet.handle} ${tweet.tags.join(' ')}`.toLowerCase().includes(q.replace(/^#/, ''))),
  ).sort((a, b) => sort === 'newest' ? a.hoursAgo - b.hoursAgo : sort === 'likes' ? b.likes - a.likes : (b.likes + b.reposts * 2 + b.replies) - (a.likes + a.reposts * 2 + a.replies));
}

export const formatCount = (n: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n).toLowerCase();
