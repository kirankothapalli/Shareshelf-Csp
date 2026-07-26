const crypto = require('crypto');
const fs = require('fs');

// Deterministic hash of an ID/receipt number, used only for duplicate-account detection.
// The raw document/number itself is never stored long-term.
function hashDocNumber(rawValue) {
  const salt = process.env.DOC_HASH_SALT || '';
  return crypto.createHash('sha256').update(salt + String(rawValue).trim().toLowerCase()).digest('hex');
}

// SHA-256 hash of a file's binary content — used for content-level duplicate detection.
// Reads file from disk synchronously (call only on small-ish verification docs).
function hashDocFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

// Generate a UUID-v4 anonymized reference ID.
// Not linkable to any user identity.
function generateAnonymizedRefId() {
  return crypto.randomUUID();
}

module.exports = { hashDocNumber, hashDocFile, generateAnonymizedRefId };
