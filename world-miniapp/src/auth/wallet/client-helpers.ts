/**
 * Generates an HMAC-SHA256 hash of the provided nonce using a secret key from the environment.
 * @param {Object} params - The parameters object.
 * @param {string} params.nonce - The nonce to be hashed.
 * @returns {string} The resulting HMAC hash in hexadecimal format.
 */
export const hashNonce = async ({ nonce }: { nonce: string }) => {
  const secret = process.env.HMAC_SECRET_KEY;
  if (!secret) {
    throw new Error('HMAC_SECRET_KEY is not set');
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(nonce));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};
