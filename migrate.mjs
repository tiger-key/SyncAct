// SyncAct スプシ → Firebase 移行スクリプト
// 使い方: node migrate.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, setDoc, addDoc, collection, doc, serverTimestamp } from 'firebase/firestore';

// ★ここに .env の値を貼り付けてください
const firebaseConfig = {
  apiKey: "AIzaSyDgw4BHTPA2FbgVEG7erTZ-lNSn77mTi9U",
  authDomain: "syncact.firebaseapp.com",
  projectId: "syncact",
  storageBucket: "syncact.appspot.com",
  messagingSenderId: "450188349761",
  appId: "1:450188349761:web:98795e8c29fdfd55cd91c0",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== Eventsデータ =====
const events = [
  { id: 'rn0hu59b', groupId: 'test',    title: 'XXXを求めて',              tags: ['🚃','日帰り','飲みもあり'],        roles: [],                                         memo: '',                                   fixedDate: null,    status: 'active' },
  { id: 'no0o9swq', groupId: 'test',    title: 'ゆるっとキャンプ',           tags: ['⛺️','日帰り可','泊まり','焚き火'],  roles: [],                                         memo: '',                                   fixedDate: null,    status: 'active' },
  { id: 'go5eurb5', groupId: '16Z-trp', title: '4月：レアハンバーグを求めて', tags: [],                                   roles: [],                                         memo: '神保町アルカサール？ 板橋区レストランオオタニ？', fixedDate: '4/26',  status: 'active' },
  { id: 'vete4wja', groupId: '16Z-trp', title: '5月：1泊2日・草津温泉旅行',  tags: [],                                   roles: [],                                         memo: '湯もみ体験、大トロ牛乳、',              fixedDate: '05/30-31', status: 'active' },
  { id: 'pv4glimr', groupId: '16Z-trp', title: '6月：祝結婚・わたこーを囲む会', tags: ['🚃','日帰り','飲みもあり'],       roles: ['店探し'],                                 memo: '',                                   fixedDate: null,    status: 'active' },
  { id: 'rpj5cmrq', groupId: '16Z-trp', title: '7or8月：おつかれさま！ちひろんを囲む会', tags: ['🚃','日帰り','飲みもあり'], roles: ['店探し'],                              memo: '',                                   fixedDate: null,    status: 'active' },
  { id: 'phkvub27', groupId: 'MDOKI',   title: '名古屋キャンプ',             tags: ['⛺️','日帰り可','泊まり','焚き火'],  roles: ['車','キャンプグッズ','食材','宿'],        memo: '',                                   fixedDate: '4月18,19日', status: 'active' },
  { id: 'lqk2bbtw', groupId: '16Z-trp', title: 'スタジオツアー賢者の石',     tags: [],                                   roles: ['チケット手配'],                           memo: '',                                   fixedDate: null,    status: 'active' },
  { id: '2pwxro0l', groupId: 'y-morio', title: '5/5家族会議(テスト)',         tags: [],                                   roles: ['ばば迎え'],                               memo: '実家▶笠森▶夜飯',                     fixedDate: null,    status: 'active' },
  { id: 'ndrdxazy', groupId: 'y-morio', title: 'ゴールデンウィークいとこ会',  tags: ['🚃','日帰り','飲み'],               roles: [],                                         memo: '',                                   fixedDate: null,    status: 'active' },
  { id: 'i375i2yo', groupId: '16Z-trp', title: '10月3日:国際教養10周年',     tags: ['🚃','日帰り','飲みもあり'],          roles: [],                                         memo: '',                                   fixedDate: null,    status: 'active' },
  { id: '56um2zcq', groupId: '16Z-trp', title: 'アウトレット・爆買い',        tags: [],                                   roles: [],                                         memo: '木更津アウトレットへ',                 fixedDate: null,    status: 'active' },
];

// ===== Responsesデータ =====
// 旧データにはパスコードがないため空文字で移行（修正機能は使えないが表示はできる）
const responses = [
  { activityId: 'rn0hu59b', name: 'ユウスケ',               dates: [], roles: [], status: 'unavailable' },
  { activityId: 'no0o9swq', name: 'エリ',                   dates: [], roles: [], status: 'unavailable' },
  { activityId: 'go5eurb5', name: 'ユウスケ (店探し)',        dates: ['2026-04-05','2026-04-26'], roles: ['店探し'], status: 'available' },
  { activityId: 'go5eurb5', name: 'エリ',                   dates: ['2026-04-11','2026-04-12','2026-04-18','2026-04-25','2026-04-26'], roles: [], status: 'available' },
  { activityId: 'go5eurb5', name: 'しゅんや',               dates: ['2026-04-05','2026-04-11','2026-04-26'], roles: [], status: 'available' },
  { activityId: 'go5eurb5', name: 'りん',                   dates: ['2026-04-05','2026-04-26'], roles: [], status: 'available' },
  { activityId: 'go5eurb5', name: 'ハル',                   dates: ['2026-04-26','2026-05-02'], roles: [], status: 'available' },
  { activityId: 'go5eurb5', name: 'わたこ',                 dates: [], roles: [], status: 'unavailable' },
  { activityId: 'go5eurb5', name: 'ちひろん',               dates: [], roles: [], status: 'unavailable' },
  { activityId: 'vete4wja', name: 'ユウスケ (宿手配/車手配)', dates: ['2026-05-02','2026-05-03','2026-05-04','2026-05-05','2026-05-06','2026-05-07','2026-05-09','2026-05-10','2026-05-16','2026-05-17','2026-05-23','2026-05-24','2026-05-30','2026-05-31'], roles: ['宿手配','車手配'], status: 'available' },
  { activityId: 'vete4wja', name: 'エリ',                   dates: ['2026-05-09','2026-05-10','2026-05-16','2026-05-17','2026-05-30','2026-05-31'], roles: [], status: 'available' },
  { activityId: 'vete4wja', name: 'しゅんや',               dates: ['2026-05-02','2026-05-03','2026-05-04','2026-05-05','2026-05-07','2026-05-10','2026-05-17','2026-05-23','2026-05-24','2026-05-30','2026-05-31'], roles: [], status: 'available' },
  { activityId: 'vete4wja', name: 'りん',                   dates: ['2026-05-02','2026-05-03','2026-05-04','2026-05-05','2026-05-06','2026-05-09','2026-05-10','2026-05-16','2026-05-17','2026-05-23','2026-05-24','2026-05-30','2026-05-31'], roles: [], status: 'available' },
  { activityId: 'vete4wja', name: 'わたこ',                 dates: [], roles: [], status: 'unavailable' },
  { activityId: 'vete4wja', name: 'ちひろん',               dates: [], roles: [], status: 'unavailable' },
  { activityId: 'vete4wja', name: 'ハル',                   dates: [], roles: [], status: 'unavailable' },
  { activityId: 'lqk2bbtw', name: 'ヨシカワ',               dates: ['2026-05-10','2026-05-16','2026-05-17'], roles: [], status: 'available' },
  { activityId: '2pwxro0l', name: 'ユウスケ',               dates: [], roles: [], status: 'unavailable' },
  { activityId: '2pwxro0l', name: 'おとうぽん',             dates: [], roles: [], status: 'unavailable' },
  { activityId: 'ndrdxazy', name: 'ユウスケ',               dates: ['2026-05-04','2026-05-05','2026-05-06','2026-05-07','2026-05-09','2026-05-10','2026-05-11'], roles: [], status: 'available' },
  { activityId: '56um2zcq', name: 'ヨシカワ',               dates: ['2026-07-03','2026-07-04','2026-07-05','2026-07-19','2026-07-20','2026-07-25','2026-07-26'], roles: [], status: 'available' },
  { activityId: '56um2zcq', name: 'そうなか',               dates: ['2026-07-04','2026-07-05','2026-07-12','2026-07-19','2026-07-20','2026-07-26'], roles: [], status: 'available' },
  { activityId: '56um2zcq', name: 'ちひろ',                 dates: [], roles: [], status: 'unavailable' },
  { activityId: '56um2zcq', name: 'ワタナベ',               dates: ['2026-07-04','2026-07-05','2026-07-18','2026-07-19','2026-07-26'], roles: [], status: 'available' },
  { activityId: '56um2zcq', name: 'クツナ',                 dates: ['2026-07-18','2026-07-19','2026-07-20','2026-07-25','2026-07-26'], roles: [], status: 'available' },
];

// ===== Presetsデータ（シート3の完全版を使用）=====
const presets = [
  { label: 'キャンプ ⛺️',       title: 'ゆるっとキャンプ',        tags: ['⛺️','日帰り可','泊まり','焚き火'],    roles: ['ドライバー','テント持参','食材調達','焚き火奉行'] },
  { label: 'ショッピング 🛍️',   title: 'アウトレット・爆買い',    tags: ['🛍️','御殿場','入間','車出し'],        roles: ['ドライバー','荷物持ち','ランチ予約','タイムキーパー'] },
  { label: '泊まり温泉 ♨️',     title: '1泊2日・温泉旅行',        tags: ['♨️','露天風呂','バイキング','酒'],      roles: ['宿手配','車出しOK','宴会部長','早起き派'] },
  { label: 'ちょっとランチ',     title: 'XXXを求めて',             tags: ['🚃','日帰り','飲みもあり'],            roles: ['店探し'] },
  { label: '週末サウナ 🌿',     title: '限界突破サウナ会',         tags: ['🌿','ととのい','現地集合','サ飯'],      roles: ['車出しOK','回数券あり','サ飯予約担当'] },
  { label: '突発飲み会 🍻',     title: '恵比寿あたりで飲む',       tags: ['🍻','20時以降','飲み放題','駅近'],      roles: ['幹事補助','店予約','一次会のみ','エンドレス'] },
  { label: 'ライブ参戦 🎤',     title: '推し活・ライブ遠征',       tags: ['🎤','物販','連番希望','現地解散'],      roles: ['チケット確保済み','グッズ代行可','車出し','宿泊調整'] },
  { label: '海沿いドライブ 🚗', title: '湘南・熱海ドライブ',       tags: ['🚗','BGM担当','海','温泉'],            roles: ['ドライバー','レンタカー手配','ルート作成','助手席専念'] },
  { label: '手ぶらBBQ 🍖',     title: '屋上BBQ・ビアガーデン',    tags: ['🍖','手ぶら','飲み放題','日帰り'],      roles: ['焼き師','買い出し','トング担当','写真係'] },
  { label: 'ボドゲ・Switch 🎮', title: '宅飲み＆ゲーム大会',       tags: ['🎮','宅飲み','持ち寄り','深夜まで'],    roles: ['ソフト持参','ボドゲ持参','場所提供','ピザ注文'] },
  { label: '日帰り温泉 ♨️',     title: '癒やしの極楽温泉',         tags: ['♨️','岩盤浴','サウナ','リフレッシュ'],  roles: ['車出しOK','タオル持参','マッサージ希望'] },
  { label: 'カフェ巡り 🍰',     title: '作業・お喋りカフェ',       tags: ['🍰','作業可','スイーツ','テラス'],      roles: ['PC持参','読書','お喋りメイン','映え写真担当'] },
];

async function migrate() {
  console.log('🚀 移行開始...');

  // Events
  console.log('\n📅 Events移行中...');
  for (const ev of events) {
    await setDoc(doc(db, 'events', ev.id), {
      groupId: ev.groupId,
      title: ev.title,
      desc: '',
      tags: ev.tags,
      roles: ev.roles,
      memo: ev.memo,
      fixedDate: ev.fixedDate,
      status: ev.status,
      createdAt: serverTimestamp(),
    });
    console.log(`  ✅ ${ev.title}`);
  }

  // Responses
  console.log('\n💬 Responses移行中...');
  for (const r of responses) {
    await addDoc(collection(db, 'responses'), {
      activityId: r.activityId,
      name: r.name,
      dates: r.dates,
      roles: r.roles,
      status: r.status,
      passcodeHash: '', // 旧データはパスコードなし（修正不可だが表示OK）
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`  ✅ ${r.name} → ${r.activityId}`);
  }

  // Presets
  console.log('\n📋 Presets移行中...');
  for (const p of presets) {
    await addDoc(collection(db, 'presets'), p);
    console.log(`  ✅ ${p.label}`);
  }

  console.log('\n🎉 移行完了！');
  process.exit(0);
}

migrate().catch(e => { console.error('❌ エラー:', e); process.exit(1); });
