const conversations = new Map();

const MAX_MESSAGES = 20;

function getHistory(userId) {
  return conversations.get(userId) || [];
}

function appendMessages(userId, userMessage, assistantMessage) {
  const history = conversations.get(userId) || [];

  const nextHistory = [
    ...history,
    { role: "user", content: userMessage },
    { role: "assistant", content: assistantMessage }
  ].slice(-MAX_MESSAGES);

  conversations.set(userId, nextHistory);

  return nextHistory;
}

function clearHistory(userId) {
  conversations.delete(userId);
}

module.exports = {
  getHistory,
  appendMessages,
  clearHistory
};
