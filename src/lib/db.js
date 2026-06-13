import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { hashSync, compareSync } from 'bcrypt-ts';
import { db } from './firebase';
import { genId, toArray } from './utils';

// ============ events ============

export async function createEvent({ groupId, title, desc, tags, roles, memo }) {
  const activityId = genId();
  await setDoc(doc(db, 'events', activityId), {
    groupId: groupId || 'default',
    title,
    desc: desc || '',
    tags: toArray(tags),
    roles: toArray(roles),
    memo: memo || '',
    fixedDate: null,
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return activityId;
}

export async function getEvent(activityId) {
  const snap = await getDoc(doc(db, 'events', activityId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function listenEvent(activityId, callback) {
  return onSnapshot(doc(db, 'events', activityId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export function listenGroupEvents(groupId, callback) {
  const q = query(
    collection(db, 'events'),
    where('groupId', '==', groupId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function updateEventMemo(activityId, memo) {
  await updateDoc(doc(db, 'events', activityId), { memo });
}

export async function setFixedDate(activityId, dateStr) {
  await updateDoc(doc(db, 'events', activityId), { fixedDate: dateStr });
}

export async function setEventStatus(activityId, status) {
  await updateDoc(doc(db, 'events', activityId), { status });
}

export async function copyEvent(ev) {
  return createEvent({
    groupId: ev.groupId,
    title: ev.title,
    desc: ev.desc,
    tags: ev.tags,
    roles: ev.roles,
    memo: ev.memo,
  });
}

// ============ responses ============

export function listenResponses(activityId, callback) {
  const q = query(
    collection(db, 'responses'),
    where('activityId', '==', activityId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function submitResponse({ activityId, name, dates, roles, status, passcode }) {
  await addDoc(collection(db, 'responses'), {
    activityId,
    name,
    dates,
    roles,
    status, // 'available' | 'unavailable'
    passcodeHash: hashSync(passcode, 8),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function verifyPasscode(response, passcode) {
  return compareSync(passcode, response.passcodeHash);
}

export async function updateResponse(responseId, { dates, roles, status }) {
  await updateDoc(doc(db, 'responses', responseId), {
    dates,
    roles,
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteResponse(responseId) {
  await deleteDoc(doc(db, 'responses', responseId));
}

// ============ presets ============

export async function getPresets() {
  const snap = await getDocs(collection(db, 'presets'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function savePreset({ label, title, tags, roles }) {
  await addDoc(collection(db, 'presets'), {
    label,
    title,
    tags: toArray(tags),
    roles: toArray(roles),
  });
}

// ============ groups ============

export async function getGroup(groupId) {
  const snap = await getDoc(doc(db, 'groups', groupId));
  return snap.exists() ? snap.data() : null;
}

export async function setGroupName(groupId, name) {
  await setDoc(doc(db, 'groups', groupId), { name }, { merge: true });
}
