import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ArrowDown, ArrowDownUp, ArrowRight, ArrowUpRight, Bookmark, Check, ChevronDown, Code2, Command, Cpu, ExternalLink, Flame, Heart, Info, Leaf, MessageCircle, Radio, Repeat2, Search, Share2, Sparkles, TrendingUp, X, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatCount, selectTweets, topics, tweets } from './data';
import type { Sort, Topic, Tweet, View } from './data';

const heroImage = `${import.meta.env.BASE_URL}assets/ai-pepe.webp`;
const xSearch = 'https://x.com/search?q=IdentityMD%20OR%20%22identity.md%22&src=typed_query&f=top';
const storageKey = 'identitymd-saved-v1';

function readSaved(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && tweets.some(t => t.id === id)) : [];
  } catch { return []; }
}

function keepDialogFocus(event: ReactKeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return;
  const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select, textarea, [tabindex="0"]')).filter(element => element.getClientRects().length > 0);
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
}

function FrogMark({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 40 40" className={className} aria-hidden="true"><path d="M5 23v-7h4v-5h9v5h4v-5h9v5h4v12h-4v5H9v-5H5z" fill="currentColor" /><path d="M11 17h5v6h-5zm13 0h5v6h-5z" fill="#132018" /><path d="M12 27h16" stroke="#132018" strokeWidth="2" /></svg>;
}

function Avatar({ kind, small = false }: { kind: Tweet['avatar']; small?: boolean }) {
  return <span className={`avatar avatar-${kind} ${small ? 'avatar-small' : ''}`} aria-hidden="true">
    {kind === 'frog' ? <img src={heroImage} alt="" /> : kind === 'pixel' ? <FrogMark /> : kind === 'orb' ? <span className="orb" /> : kind === 'terminal' ? <Code2 size={21} /> : kind === 'flower' ? <Sparkles size={22} /> : <Zap size={22} />}
  </span>;
}

function TweetMedia({ kind }: { kind: NonNullable<Tweet['media']> }) {
  if (kind === 'pepe') return <div className="tweet-media pepe-media"><img src={heroImage} alt="Pepe geared up with a glowing AI blaster" loading="lazy" /><span className="meme-caption">ARMED WITH CONTEXT.</span><span className="media-label"><Cpu size={11} /> AI-POWERED FREN</span></div>;
  if (kind === 'code') return <div className="tweet-media code-media"><div><i /><i /><i /><span>identity.md</span></div><code><span># A little context</span><br />name: human<br />mode: build something good<br />preferences:<br />&nbsp; - less noise<br />&nbsp; - more green</code></div>;
  return <div className="tweet-media identity-media"><div className="identity-orbit" aria-hidden="true"><span /><span /><span /></div><span className="media-label">A LITTLE CONTEXT CHANGES EVERYTHING.</span><div className="identity-file"><FrogMark /><span>identity<span className="lime">.md</span></span></div><span className="identity-caption">Your context. Everywhere you build.</span><div className="file-tags"><span><Cpu size={12} /> Your agents</span><span><ArrowRight size={12} /></span><span><Leaf size={12} /> More you</span></div></div>;
}

function TweetCard({ tweet, saved, toggleSave, openTweet, shareTweet, onTag }: {
  tweet: Tweet; saved: boolean; toggleSave: (id: string) => void; openTweet: (tweet: Tweet) => void; shareTweet: (tweet: Tweet) => void; onTag: (tag: string) => void;
}) {
  return <article className="tweet-card" data-tweet-id={tweet.id} aria-label={`Tweet by ${tweet.name}`}>
    <div className="tweet-author"><Avatar kind={tweet.avatar} /><div className="author-info"><h3>{tweet.name}</h3><span>{tweet.handle.replace('_demo', '')} <span className="author-time">· {tweet.hoursAgo < 24 ? `${tweet.hoursAgo}h` : `${Math.floor(tweet.hoursAgo / 24)}d`}</span></span></div><span className="x-mark" role="img" aria-label="Demo X post">𝕏</span></div>
    <p className="tweet-copy">{tweet.text}</p>
    <div className="tweet-tags">{tweet.tags.map(tag => <button key={tag} onClick={() => onTag(tag)}>#{tag}</button>)}</div>
    {tweet.media && <TweetMedia kind={tweet.media} />}
    <div className="tweet-meta"><span><span className="topic-dot" />{tweet.topic}</span><button onClick={() => openTweet(tweet)} aria-label={`Read tweet by ${tweet.name}`}>Read tweet <ArrowUpRight size={13} /></button></div>
    <div className="tweet-footer"><div className="engagement"><span title={`${tweet.replies} sample replies`}><MessageCircle /><span>{formatCount(tweet.replies)}</span></span><span title={`${tweet.reposts} sample reposts`}><Repeat2 /><span>{formatCount(tweet.reposts)}</span></span><span title={`${tweet.likes} sample likes`}><Heart /><span>{formatCount(tweet.likes)}</span></span></div><div className="tweet-actions"><button className={saved ? 'icon-button is-saved' : 'icon-button'} onClick={() => toggleSave(tweet.id)} aria-pressed={saved} aria-label={`${saved ? 'Unsave' : 'Save'} tweet by ${tweet.name}`} title={saved ? 'Unsave tweet' : 'Save tweet'}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /></button><button className="icon-button" onClick={() => shareTweet(tweet)} aria-label={`Share tweet by ${tweet.name}`} title="Copy link"><Share2 size={15} /></button></div></div>
  </article>;
}

function ViewNav({ view, savedCount, navigate }: { view: View; savedCount: number; navigate: (view: View) => void }) {
  const items: { id: View; label: string; icon: LucideIcon }[] = [{ id: 'top', label: 'Top tweets', icon: Flame }, { id: 'latest', label: 'Latest', icon: Radio }, { id: 'saved', label: 'Saved tweets', icon: Bookmark }];
  return <nav className="view-nav" aria-label="Feed navigation">{items.map(({ id, label, icon: Icon }) => <a key={id} aria-label={label} href={`#${id}`} onClick={() => navigate(id)} aria-current={view === id ? 'page' : undefined}><Icon size={18} /><span>{label}</span>{id === 'top' ? <span className="nav-spark">✦</span> : id === 'saved' && savedCount > 0 ? <span className="nav-count">{savedCount}</span> : null}</a>)}</nav>;
}

export default function App() {
  const [view, setView] = useState<View>('top');
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<Topic>('All tweets');
  const [period, setPeriod] = useState('7d');
  const [sort, setSort] = useState<Sort>('engagement');
  const [limit, setLimit] = useState(6);
  const [saved, setSaved] = useState(readSaved);
  const [notice, setNotice] = useState('');
  const [selectedTweet, setSelectedTweet] = useState<Tweet | null>(null);
  const [shareFallback, setShareFallback] = useState('');
  const [storageWarning, setStorageWarning] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const feedRef = useRef<HTMLHeadingElement>(null);
  const aboutRef = useRef<HTMLDialogElement>(null);
  const tweetDialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const filtered = selectTweets({ view, query, topic, period, sort, saved });

  function navigate(next: View) {
    setView(next); setQuery(''); setTopic('All tweets'); setPeriod('7d'); setSort(next === 'latest' ? 'newest' : 'engagement'); setLimit(6);
  }

  useEffect(() => {
    function onHash() {
      const hash = window.location.hash.slice(1);
      if (hash === 'top' || hash === 'latest' || hash === 'saved') navigate(hash);
      if (hash.startsWith('tweet=')) {
        const tweet = tweets.find(t => t.id === hash.slice(6));
        if (tweet) { returnFocusRef.current = feedRef.current; setSelectedTweet(tweet); }
      }
    }
    onHash();
    window.addEventListener('hashchange', onHash);
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) && !target.isContentEditable && !document.querySelector('dialog[open]') && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); searchRef.current?.focus(); }
    }
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('keydown', onKey); };
  }, []);

  useEffect(() => { setLimit(6); }, [query, topic, period, sort]);
  useEffect(() => { if (selectedTweet) tweetDialogRef.current?.showModal(); }, [selectedTweet]);

  function toggleSave(id: string) {
    const next = saved.includes(id) ? saved.filter(value => value !== id) : [...saved, id];
    setSaved(next);
    setNotice(next.includes(id) ? 'Tweet saved to your collection.' : 'Tweet removed from your collection.');
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setStorageWarning(false); }
    catch { setStorageWarning(true); }
  }

  function filterTag(tag: string) {
    setQuery(tag); setTopic('All tweets');
    if (view === 'saved') { setView('top'); history.replaceState(null, '', '#top'); }
    feedRef.current?.scrollIntoView({ block: 'start' });
  }

  function openTweet(tweet: Tweet) { returnFocusRef.current = document.activeElement as HTMLElement; setShareFallback(''); setSelectedTweet(tweet); }
  function closeTweet() {
    setSelectedTweet(null); setShareFallback('');
    if (window.location.hash.startsWith('#tweet=')) history.replaceState(null, '', `#${view}`);
    returnFocusRef.current?.focus();
  }
  async function shareTweet(tweet: Tweet) {
    const url = new URL(window.location.href); url.hash = `tweet=${tweet.id}`;
    try { await navigator.clipboard.writeText(url.href); setNotice('Link copied. Share this tweet with a fren.'); }
    catch { if (!tweetDialogRef.current?.open) openTweet(tweet); setShareFallback(url.href); setNotice('Copy the link from the tweet details.'); }
  }

  function clearFilters() { setQuery(''); setTopic('All tweets'); setPeriod('7d'); }
  function explore() { feedRef.current?.scrollIntoView({ block: 'start' }); feedRef.current?.focus({ preventScroll: true }); }

  return <div className="app-shell">
    <a className="skip-link" href="#feed">Skip to tweets</a>
    <aside className="sidebar">
      <a className="brand" href="#top" onClick={() => navigate('top')} aria-label="IdentityMD home"><span className="brand-icon"><FrogMark /></span><span>identity<span className="brand-suffix">.md</span></span></a>
      <div className="sidebar-section-label">The community signal</div>
      <ViewNav view={view} savedCount={saved.length} navigate={navigate} />
      <div className="sidebar-rule" />
      <span className="sidebar-section-label">Explore the ecosystem</span>
      <div className="resource-nav"><a href={xSearch} target="_blank" rel="noreferrer"><span className="resource-x">𝕏</span> Conversation on X <ArrowUpRight size={15} /></a><button onClick={() => aboutRef.current?.showModal()}><Info size={18} /> About this feed <ArrowUpRight size={15} /></button></div>
      <div className="sidebar-bottom"><div className="fren-card"><span className="fren-card-icon"><Cpu size={20} /><Sparkles size={13} /></span><p>Built different.<br />Armed with AI.</p><span>A little more context.<br />A lot more possibility.</span><a href={xSearch} target="_blank" rel="noreferrer">Find your frens <ArrowUpRight size={15} /></a></div><div className="sidebar-footer"><span className="status-dot" /> Human ideas. AI energy.</div><span className="version">Independent community concept · v1.0</span></div>
    </aside>

    <div className="page">
      <header className="topbar"><div className="breadcrumb"><span>Community</span><span>/</span><strong>The signal</strong></div><div className="topbar-actions"><div className="search-box"><Search size={17} /><label htmlFor="search-tweets" className="sr-only">Search tweets</label><input ref={searchRef} id="search-tweets" type="search" placeholder="Search the conversation…" value={query} onChange={e => setQuery(e.target.value)} /><kbd>/</kbd></div><span className="demo-badge"><span /> Demo feed</span></div></header>
      <main id="main-content">
        <section className="hero" aria-labelledby="hero-title"><div className="hero-content"><div className="eyebrow"><span className="status-dot" /> Welcome to the signal</div><h1 id="hero-title">Big ideas.<br /><span>Based identities.</span></h1><p>The best of the IdentityMD conversation.<br className="desktop-break" /> Ideas, builds, and a few very based frogs.</p><button className="primary-button" onClick={explore}>Explore the feed <ArrowDown size={16} /></button><div className="hero-footnote"><span className="tiny-avatars"><Avatar kind="pixel" small /><Avatar kind="orb" small /><Avatar kind="flower" small /></span><span>For the humans behind the agents.</span></div></div><div className="hero-visual"><img src={heroImage} alt="Pepe, an AI-equipped frog operator, holding a glowing green sci-fi blaster" fetchPriority="high" /><span className="hero-chip"><Cpu size={13} /> Context is a superpower.</span><span className="hero-coordinate">FREN_001 / AI AUGMENTED</span></div></section>

        <div className="stats-strip" role="group" aria-label="Demo collection statistics"><div><span className="stat-icon"><MessageCircle size={18} /></span><div><span className="stat-label">In the conversation</span><div className="stat-number">9 <span>curated tweets</span></div></div><svg className="sparkline" viewBox="0 0 80 30" aria-hidden="true"><path d="M1 26 12 21 23 25 34 14 45 19 56 9 67 12 79 2" /></svg></div><div><span className="stat-icon"><Heart size={18} /></span><div><span className="stat-label">Community love</span><div className="stat-number">5.5k <span>sample likes</span></div></div><span className="stat-aside"><TrendingUp size={13} /> Good energy</span></div><div><span className="stat-icon"><Cpu size={18} /></span><div><span className="stat-label">One shared idea</span><div className="stat-number stat-phrase">More context. More you.</div></div></div></div>

        <div className="content-layout"><section className="feed-section" aria-labelledby="feed"><div className="feed-heading"><div><h2 id="feed" ref={feedRef} tabIndex={-1}>{view === 'saved' ? <Bookmark size={23} /> : view === 'latest' ? <Radio size={23} /> : <Flame size={23} />}{view === 'saved' ? 'Saved tweets' : view === 'latest' ? 'Fresh from the pond' : 'Top tweets'}<span className="count-badge">{filtered.length}</span></h2><p>{view === 'saved' ? 'Good ideas, kept close. Saved on this device.' : view === 'latest' ? 'The newest ideas in the demo collection.' : 'The ideas making their way around the pond.'}</p></div><label className="select-wrap period-select"><span className="sr-only">Time period</span><select value={period} onChange={e => setPeriod(e.target.value)}><option value="24h">Last 24 hours</option><option value="7d">This week</option><option value="all">All time</option></select><ChevronDown size={14} /></label></div>
          <div className="feed-controls"><div className="topic-filters" role="group" aria-label="Filter by topic">{topics.map(item => <button key={item} className={topic === item ? 'selected' : ''} aria-pressed={topic === item} onClick={() => setTopic(item)}>{item === 'All tweets' && <Sparkles size={13} />}{item}</button>)}</div><label className="sort-control"><ArrowDownUp size={13} /><span className="sr-only">Sort tweets</span><select value={sort} onChange={e => setSort(e.target.value as Sort)}><option value="engagement">Top engagement</option><option value="newest">Newest first</option><option value="likes">Most liked</option></select><ChevronDown size={12} /></label></div>
          <div className="feed-context"><span><span className="status-dot" /> {query ? `Results for “${query}”` : 'A curated collection. A shared point of view.'}</span><button onClick={() => aboutRef.current?.showModal()}>About this demo <Info size={12} /></button></div>
          <p className="sr-only" role="status">{filtered.length} {filtered.length === 1 ? 'tweet' : 'tweets'} found.</p>
          {storageWarning && <div className="storage-warning" role="alert">Browser storage is unavailable. Saved tweets will last until you leave this page.</div>}
          {filtered.length > 0 ? <><div className="tweet-grid">{filtered.slice(0, limit).map(tweet => <TweetCard key={tweet.id} tweet={tweet} saved={saved.includes(tweet.id)} toggleSave={toggleSave} openTweet={openTweet} shareTweet={shareTweet} onTag={filterTag} />)}</div>{limit < filtered.length ? <button className="load-more" onClick={() => setLimit(n => n + 6)}>Show more tweets <ArrowDown size={15} /><span>{filtered.length - limit} more</span></button> : <p className="end-note"><FrogMark /> You’re all caught up. Stay curious, fren.</p>}</> : <div className="empty-state"><span><Search size={30} /></span><h3>{view === 'saved' && saved.length === 0 ? 'Your good-idea collection starts here.' : 'No tweets in this corner of the pond.'}</h3><p>{view === 'saved' && saved.length === 0 ? 'Save a tweet using its bookmark button, then find it here whenever you need it.' : query ? `Nothing matches “${query}” with these filters. Try another search or clear your filters.` : 'Try a different topic or time period to find more ideas.'}</p><button className="secondary-button" onClick={view === 'saved' && saved.length === 0 ? () => { navigate('top'); window.location.hash = 'top'; } : clearFilters}>{view === 'saved' && saved.length === 0 ? 'Explore top tweets' : 'Clear filters'}<ArrowRight size={16} /></button></div>}
        </section>

        <aside className="right-rail" aria-label="Community highlights"><section className="trending-panel"><div className="rail-heading"><h2><TrendingUp size={17} /> In the conversation</h2><span>↗</span></div><p className="rail-intro">Follow a thread. Find your people.</p>{[{ tag: 'IdentityMD', label: 'The shared starting point', count: 9 }, { tag: 'AIAgents', label: 'A little more autonomous', count: 3 }, { tag: 'DigitalIdentity', label: 'You, across the internet', count: 3 }, { tag: 'BuildInPublic', label: 'Less talking. More shipping.', count: 2 }].map((item, i) => <button className="trending-topic" key={item.tag} onClick={() => filterTag(item.tag)}><span className="trend-index">0{i + 1}</span><span><strong>#{item.tag}</strong><small>{item.label}</small></span><span className="trend-count">{item.count}<ArrowUpRight size={12} /></span></button>)}<span className="rail-note">Topics from this demo collection</span></section>
          <section className="spotlight-panel"><div className="eyebrow"><Sparkles size={12} /> The bigger picture</div><div className="spotlight-art" aria-hidden="true"><div className="mini-node node-one"><Code2 /></div><div className="mini-node node-two"><Command /></div><span className="spotlight-frog"><FrogMark /></span><div className="mini-node node-three"><Cpu /></div><div className="orbit-line" /></div><h2>One identity.<br />Endless possibilities.</h2><p>AI gets more useful when it has your context. That’s a conversation worth having.</p><a href={xSearch} target="_blank" rel="noreferrer">Explore IdentityMD on X <ArrowUpRight size={15} /></a></section>
          <div className="community-note"><Leaf size={16} /><p>Made for the community.<br /><span>Powered by a healthy dose of frog energy.</span></p></div>
        </aside></div>
        <footer className="page-footer"><span><FrogMark /> identity.md <span>· The community signal</span></span><button onClick={() => aboutRef.current?.showModal()}>Demo content & attribution <ArrowUpRight size={12} /></button></footer>
      </main>
    </div>
    <div className={`toast ${notice ? 'toast-visible' : ''}`} role="status">{notice && <><Check size={17} /><span>{notice}</span><button className="icon-button" onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={16} /></button></>}</div>

    <dialog onKeyDown={keepDialogFocus} ref={aboutRef} className="modal" onClick={event => { if (event.target === event.currentTarget) aboutRef.current?.close(); }} aria-labelledby="about-title"><button className="icon-button modal-close" onClick={() => aboutRef.current?.close()} aria-label="Close about this feed"><X /></button><span className="modal-emblem"><FrogMark /></span><div className="eyebrow">A community concept</div><h2 id="about-title">A little signal.<br />A lot of possibility.</h2><p>This is an independent IdentityMD community concept. All 9 tweets, authors, handles, engagement counts, and relative times are fictional examples, not actual X posts or endorsements.</p><h3>How the feed works</h3><p>Top engagement ranks the demo tweets by likes + twice the reposts + replies. You can also sort by likes or recency, search the collection, and filter by topic or time.</p><h3>Your saved collection</h3><p>Bookmarks stay in this browser’s local storage. They are not synced to X or another device. Share links open a tweet in this site.</p><h3>Made with frog energy</h3><p>The AI Pepe illustration was generated for this concept. The design follows Better Interface guidance by Jakub Krehel, with documentation guidance adapted from Paul Bakaus’s Impeccable.</p><a className="secondary-button" href={xSearch} target="_blank" rel="noreferrer">Find the real conversation on X <ExternalLink size={16} /></a></dialog>

    <dialog onKeyDown={keepDialogFocus} ref={tweetDialogRef} className="modal tweet-modal" onClose={closeTweet} onClick={event => { if (event.target === event.currentTarget) tweetDialogRef.current?.close(); }} aria-labelledby="tweet-dialog-title"><button className="icon-button modal-close" onClick={() => tweetDialogRef.current?.close()} aria-label="Close tweet"><X /></button>{selectedTweet && <><div className="eyebrow">From the demo collection</div><h2 id="tweet-dialog-title">A little more context</h2><TweetCard tweet={selectedTweet} saved={saved.includes(selectedTweet.id)} toggleSave={toggleSave} openTweet={() => {}} shareTweet={shareTweet} onTag={tag => { tweetDialogRef.current?.close(); filterTag(tag); }} /><p className="demo-detail"><Info size={14} /> Fictional example · Engagement and time are sample data.</p>{shareFallback && <label className="share-fallback">Copy this tweet link<input readOnly value={shareFallback} onFocus={e => e.target.select()} /></label>}</>}</dialog>
  </div>;
}
