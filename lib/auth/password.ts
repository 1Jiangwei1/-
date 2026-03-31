import bcrypt from "bcrypt";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

function looksLikeBcryptHash(value: string) {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

export async function verifyPassword(password: string, hash: string) {
  if (!hash) {
    return false;
  }

  if (!looksLikeBcryptHash(hash)) {
    return password === hash;
  }

  return bcrypt.compare(password, hash);
}

export async function needsPasswordRehash(hash: string) {
  return !looksLikeBcryptHash(hash);
}
