// lib/blockchain.js
// Off-chain blockchain for interview report integrity.
// Each report gets a blockchain block chained to the previous one via block_hash.
// No content hash — integrity is proven purely through the chain.

import crypto from "crypto";

/**
 * SHA-256 of a UTF-8 string. Returns lowercase hex.
 */
export function sha256(data) {
  return crypto.createHash("sha256").update(String(data), "utf8").digest("hex");
}

/**
 * Compute a block hash.
 * block_hash = SHA256("blockIndex|reportId|previousHash|createdAt")
 */
export function computeBlockHash({ block_index, report_id, previous_hash, created_at }) {
  const ts = created_at instanceof Date ? created_at.toISOString() : String(created_at ?? "");
  const data = `${block_index}|${report_id}|${previous_hash}|${ts}`;
  return sha256(data);
}

/**
 * Verify a blockchain block's own hash.
 * Returns { valid: bool, reason: string }
 */
export function verifyBlockHash(block) {
  const expected = computeBlockHash({
    block_index:   block.block_index,
    report_id:     block.report_id,
    previous_hash: block.previous_hash,
    created_at:    block.created_at,
  });

  if (expected !== block.block_hash) {
    return { valid: false, reason: "Block hash mismatch — blockchain entry has been tampered with" };
  }
  return { valid: true, reason: "Block hash verified" };
}
