const users = new Map();
const progress = [];

function upsertUser(userId, username, timestamp) {
  const existing = users.get(userId);
  if (existing) {
    users.set(userId, {
      ...existing,
      username: username || existing.username,
      last_seen_at: timestamp
    });
    return;
  }

  users.set(userId, {
    user_id: userId,
    username: username || null,
    first_seen_at: timestamp,
    last_seen_at: timestamp
  });
}

function addProgress(entry) {
  progress.push({
    id: progress.length + 1,
    ...entry
  });
}

module.exports = {
  upsertUser,
  addProgress
};

