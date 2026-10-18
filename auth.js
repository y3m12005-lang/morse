import { firebaseConfig } from "./auth-config.js";
export const authConfigured = Boolean(firebaseConfig?.apiKey && firebaseConfig?.projectId);
let sdkPromise;
async function sdk() {
  if (!authConfigured)
    throw new Error("Google sign-in is not available yet. You can use the course on this device while setup is completed.");
  if (!sdkPromise)
    sdkPromise = Promise.all([
      import("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"),
    ]).then(([app, auth]) => ({ ...auth, instance: auth.getAuth(app.initializeApp(firebaseConfig)) }));
  return sdkPromise;
}
export async function watchAccount(callback) {
  if (!authConfigured) {
    callback(null);
    return;
  }
  try {
    const s = await sdk();
    s.onAuthStateChanged(s.instance, callback);
  } catch {
    callback(null);
  }
}
export async function googleSignIn() {
  const s = await sdk(),
    provider = new s.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    return (await s.signInWithPopup(s.instance, provider)).user;
  } catch (e) {
    const messages = {
      "auth/popup-closed-by-user": "The sign-in window was closed. Try again when you’re ready.",
      "auth/popup-blocked": "Allow the sign-in popup for this site, then try again.",
      "auth/unauthorized-domain": "This website address still needs to be authorized for Google sign-in.",
      "auth/network-request-failed": "The sign-in service could not be reached. Please check your connection.",
    };
    throw new Error(messages[e.code] || "Google sign-in could not finish. Please try again.");
  }
}
export async function googleSignOut() {
  if (authConfigured) {
    const s = await sdk();
    await s.signOut(s.instance);
  }
}
