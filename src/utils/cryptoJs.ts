import CryptoJS from "crypto-js";

const secretKey = process.env.AES_SECRET_KEY || "your-32-char-secret-key"; // keep it secret & consistent

// Encrypt text
export function encrypt(text: string) {
  return CryptoJS.AES.encrypt(text, secretKey).toString();
}

// Decrypt text
export function decrypt(cipherText: string) {
  const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}