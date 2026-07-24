const crypto = require('crypto');

// Deterministic hash of an ID/receipt number, used only for duplicate-account detection.
// The raw document/number itself is never stored long-term.
function hashDocNumber(rawValue) {
  return crypto.createHash('sha256').update(String(rawValue).trim().toLowerCase()).digest('hex');
}

module.exports = { hashDocNumber };
