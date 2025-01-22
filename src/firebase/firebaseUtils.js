// src/firebase/utils.js
import { get, ref, set, update, remove, push } from 'firebase/database';
import { database as db } from './config';


export const getData = async (path) => {

    const snapshot = await get(ref(db, path));
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return null;
    }
}    

export const setData = async (path, data) => {
  const newRef = push(ref(db, path));
  await set(newRef, data);
  return newRef.key;
};

export const updateData = async (path, data) => {
  await update(ref(db, path), data);
};

export const removeData = async (path) => {
  await remove(ref(db, path));
};
