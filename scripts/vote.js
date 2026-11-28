import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://xbrndlhzaluksjhdbnur.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0kunmksX8TRkAMaVZeEcRg_BVe2B9Yv';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const refreshEveryMs = 30000;

const statusEl = document.getElementById('voting-status');
const messageEl = document.getElementById('standings-message');
const listEl = document.getElementById('category-standings');
const ballotEl = document.getElementById('voting-ballot');
const ballotMessageEl = document.getElementById('ballot-message');
let selectedNominationId = null;
let ballotOpen = false;
const completedCategories = new Set();
let ballotInitialized = false;
const searchEl = document.getElementById('nominee-search');
let latestCategories = [];
let requestInFlight = false;

const number = value => Number(value || 0).toLocaleString();
const setText = (id, value) => {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
};

function normalizeCategories(payload) {
  if (Array.isArray(payload.categories)) {
    return payload.categories.map(group => ({
      name: String(group.category_name || group.category || 'Uncategorised'),
      nominees: Array.isArray(group.nominees) ? group.nominees : []
    }));
  }
  const groups = new Map();
  (Array.isArray(payload.nominees) ? payload.nominees : []).forEach(nominee => {
    const category = String(nominee.category || 'Uncategorised');
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(nominee);
  });
  return [...groups.entries()].map(([name, nominees]) => ({ name, nominees }));
}

function renderStandings() {
  const query = (searchEl?.value || '').trim().toLowerCase();
  listEl.replaceChildren();
  let shown = 0;

  latestCategories.forEach(category => {
    const nominees = [...category.nominees]
      .filter(n => String(n.nominee_name || n.name || '').toLowerCase().includes(query) ||
                   category.name.toLowerCase().includes(query))
      .sort((a, b) => Number(b.vote_count ?? b.votes ?? 0) - Number(a.vote_count ?? a.votes ?? 0) ||
                      String(a.nominee_name || a.name || '').localeCompare(String(b.nominee_name || b.name || '')));
    if (!nominees.length) return;
    shown += nominees.length;

    const card = document.createElement('article');
    card.className = 'category-card';
    const heading = document.createElement('h3');
    heading.textContent = category.name;
    card.append(heading);

    let previousVoteCount = null;
    let displayedRank = 0;
    nominees.forEach((nominee, index) => {
      const currentVoteCount = Number(nominee.vote_count ?? nominee.votes ?? 0);
      if (previousVoteCount === null || currentVoteCount !== previousVoteCount) {
        displayedRank = index + 1;
      }
      previousVoteCount = currentVoteCount;

      const row = document.createElement('div');
      row.className = 'nominee-row';
      const rank = document.createElement('span');
      rank.className = 'nominee-rank';
      rank.textContent = '#' + displayedRank;
      const name = document.createElement('span');
      name.className = 'nominee-name';
      name.textContent = String(nominee.nominee_name || nominee.name || 'Nominee');
      const votes = document.createElement('strong');
      votes.className = 'nominee-votes';
      votes.textContent = number(nominee.vote_count ?? nominee.votes);
      votes.setAttribute('aria-label', number(nominee.vote_count ?? nominee.votes) + ' votes');
      row.append(rank, name, votes);
      card.append(row);
    });
    listEl.append(card);
  });

  messageEl.hidden = shown > 0;
  if (!shown) messageEl.textContent = query ? 'No nominees match your search.' : 'No eligible nominees or live standings are available yet.';
}


function renderBallot() {
  if (!ballotEl) return;
  ballotEl.replaceChildren();
  if (!ballotOpen) {
    ballotEl.textContent = 'Voting is currently closed.';
    return;
  }
  const groups = new Map();
  latestCategories.forEach(category => {
    const rows = category.nominees.filter(n => Number.isSafeInteger(Number(n.nomination_id)) && Number(n.nomination_id) > 0);
    if (rows.length) groups.set(category.name, rows);
  });
  if (!groups.size) {
    ballotEl.textContent = 'No eligible nominees are available for voting yet.';
    return;
  }
  let categoryIndex = 0;
  groups.forEach((nominees, categoryName) => {
    if (completedCategories.has(categoryName)) return;
    const section = document.createElement('section');
    section.className = 'category-card ballot-category';
    section.dataset.category = categoryName;
    const heading = document.createElement('h3');
    heading.textContent = categoryName;
    section.append(heading);
    nominees.forEach(nominee => {
      const label = document.createElement('label');
      label.className = 'ballot-option';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'nomination_id_' + categoryIndex;
      radio.value = String(nominee.nomination_id);
      const name = document.createElement('span');
      name.textContent = String(nominee.nominee_name || 'Nominee');
      label.append(radio, name);
      section.append(label);
    });
    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'btn ballot-submit';
    submit.textContent = 'Vote in this category';
    submit.disabled = true;
    submit.addEventListener('click', () => {
      const selected = section.querySelector('input[type="radio"]:checked');
      if (selected) submitVote(Number(selected.value), section, submit);
    });
    section.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => { submit.disabled = false; });
    });
    section.append(submit);
    ballotEl.append(section);
    categoryIndex += 1;
  });
  if (!ballotEl.children.length) ballotEl.textContent = completedCategories.size
    ? 'You have already voted in every category available to this browser.'
    : 'No ballot categories are available.';
}

async function initializeBallot() {
  if (!ballotEl || ballotInitialized) return;
  ballotInitialized = true;
  try {
    const response = await fetch('/api/voter-session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    if (!response.ok) throw new Error('Voting session could not be initialized.');
    const session = await response.json();
    (session.voted_categories || []).forEach(category => completedCategories.add(category));
    if (ballotMessageEl) ballotMessageEl.textContent = 'Choose one nominee in each category. This browser can submit one vote per category.';
  } catch (error) {
    ballotInitialized = false;
    console.warn('Voting session unavailable:', error);
    if (ballotMessageEl) ballotMessageEl.textContent = 'The ballot is not available on this preview host yet. Please use the official voting website when voting opens.';
  }
}

async function submitVote(nominationId, section, button) {
  if (!nominationId || !button) return;
  if (!window.confirm('Submit your vote for this nominee? This browser can vote only once in this category.')) return;
  button.disabled = true;
  button.textContent = 'Submitting…';
  try {
    const categoryName = section.dataset.category;
    const response = await fetch('/api/submit-vote', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nomination_id: nominationId })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Your vote could not be recorded.');
    completedCategories.add(categoryName);
    section.replaceChildren();
    const success = document.createElement('p');
    success.className = 'ballot-success';
    success.textContent = result.message || 'Your vote has been recorded in this category.';
    section.append(success);
    await loadStandings();
  } catch (error) {
    if (ballotMessageEl) ballotMessageEl.textContent = error.message;
    button.disabled = false;
    button.textContent = 'Vote in this category';
  }
}

async function loadStandings() {
  if (requestInFlight) return;
  requestInFlight = true;
  statusEl.textContent = 'Updating live standings…';
  try {
    const { data, error } = await supabase.rpc('get_public_voting_standings');
    if (error) throw error;
    if (!data || typeof data !== 'object') throw new Error('No public standings were returned.');

    latestCategories = normalizeCategories(data);
    ballotOpen = data.voting_open === true || String(data.voting_open).toLowerCase() === 'true';
    await initializeBallot();
    renderBallot();
    const allNominees = latestCategories.flatMap(group => group.nominees);
    const totalVotes = allNominees.reduce((sum, nominee) => sum + Number(nominee.vote_count ?? nominee.votes ?? 0), 0);
    setText('nominee-total', number(allNominees.length));
    setText('category-total', number(latestCategories.length));
    setText('vote-total', number(data.total_votes ?? totalVotes));

    const isOpen = data.voting_open === true || String(data.voting_open).toLowerCase() === 'true';
    statusEl.textContent = isOpen ? '● Voting is open · Live standings' : 'Voting is currently closed';
    statusEl.classList.toggle('is-open', isOpen);
    setText('last-updated', 'Last updated ' + new Date().toLocaleTimeString());
    renderStandings();
  } catch (error) {
    console.error('Unable to load public voting standings:', error);
    statusEl.textContent = 'Live standings temporarily unavailable';
    messageEl.hidden = false;
    messageEl.textContent = 'We cannot retrieve verified live standings right now. Please check again shortly.';
    setText('nominee-total', '—');
    setText('category-total', '—');
    if (!latestCategories.length) {
      setText('nominee-total', '—');
      setText('category-total', '—');
      setText('vote-total', '—');
    } else {
      setText('last-updated', 'Showing the last successful update');
    }
  } finally {
    requestInFlight = false;
  }
}

searchEl?.addEventListener('input', renderStandings);

loadStandings();
window.setInterval(loadStandings, refreshEveryMs);
