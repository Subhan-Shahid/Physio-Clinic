// src/lib/localAuth.ts
let loggedIn = false;

export const isLocalAuthed = () => loggedIn;
export const setLocalAuthed = (v: boolean) => {
  loggedIn = v;
};
