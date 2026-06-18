import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { hashSync, compareSync } from 'bcrypt-ts';
import { db } from './firebase';
import { genId, toArray } from './utils';

// ============ events ============

export async function createEvent({ groupId, title, desc, tags, roles, memo, targetMonth, coverImage, eventMode, hostName }) {
  const activityId = genId();
  await setDoc(doc(db, 'events', activityId), {
    groupId: groupId || 'default',
    title,
    desc: desc || '',
    tags: toArray(tags),
    roles: toArray(roles),
    memo: memo || '',
    targetMonth: targetMonth || null,   // "2026-07" 形式。回答画面のカレンダー初期表示月
    coverImage: coverImage || null,     // リサイズ済みdataURL
    eventMode: eventMode || 'schedule',
    hostName: hostName || '',           // ホストの合言葉（ゲストが入力して閲覧制限を突破）
    fixedDate: null,
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return activityId;
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

export async function updateEventCover(activityId, coverImage) {
  await updateDoc(doc(db, 'events', activityId), { coverImage });
}

// タイトル・タグ・役割・候補月などの後編集
export async function updateEventInfo(activityId, fields) {
  const patch = {};
  if (fields.title !== undefined) patch.title = fields.title;
  if (fields.tags !== undefined) patch.tags = toArray(fields.tags);
  if (fields.roles !== undefined) patch.roles = toArray(fields.roles);
  if (fields.targetMonth !== undefined) patch.targetMonth = fields.targetMonth || null;
  if (fields.hostName !== undefined) patch.hostName = fields.hostName;
  await updateDoc(doc(db, 'events', activityId), patch);
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
    targetMonth: null, // コピー時は月をリセット
    coverImage: ev.coverImage,
    eventMode: ev.eventMode,
    hostName: ev.hostName,
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

export async function submitResponse({ activityId, name, dates, roles, status, passcode, comment, invitedBy }) {
  await addDoc(collection(db, 'responses'), {
    activityId,
    name,
    dates,
    roles,
    status,
    comment: comment || '',
    invitedBy: invitedBy || '',
    passcodeHash: hashSync(passcode, 8),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function verifyPasscode(response, passcode) {
  if (!response.passcodeHash) return false; // 旧移行データはパスコードなし
  return compareSync(passcode, response.passcodeHash);
}

export async function updateResponse(responseId, { dates, roles, status, comment, invitedBy }) {
  await updateDoc(doc(db, 'responses', responseId), {
    dates,
    roles,
    status,
    comment: comment || '',
    invitedBy: invitedBy || '',
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
