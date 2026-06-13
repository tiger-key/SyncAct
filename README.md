# SyncAct v2.0 — Firebase + React 版

予定調整アプリの全面改修版。GAS/スプレッドシート → Firebase Firestore に移行し、
素のHTML → React + Vite に書き直したもの。

---

## 🆕 v2.0 で変わったこと

### バグ修正
- **祝日ハイライトの日付ズレ**: `toISOString()`がUTC変換するせいで日本時間で1日ずれていた → ローカル日付フォーマットに修正（`src/lib/utils.js` の `fmtDateLocal`）
- **タグ等のDB列ズレ**: スプシの列インデックス参照が原因 → Firestoreはキー名参照なので根本解決。tags/rolesは配列として保存

### 新機能
- ✅ **リアルタイム更新**: Firestoreの `onSnapshot` で回答状況が即時反映
- ✅ **日程確定機能**: 日程候補リストから「確定」ボタンでfixedDateを設定/解除
- ✅ **ベスト日ハイライト**: 参加可能人数が最多の日をカレンダー（緑枠）と候補リスト（BESTバッジ）でハイライト
- ✅ **回答の修正・削除**: 回答時に4桁パスコードを設定 → 回答状況の名前をタップ → パスコード入力で修正/削除（bcryptハッシュで保存）
- ✅ **アーカイブ + コピー**: 終わったイベントをアーカイブ（一覧の折りたたみへ移動）、コピーして同条件で新規作成
- ✅ **URLパラメータ依存の解消**: `/e/:activityId` でFirestoreから直接取得。URLにtitle/tags等を載せない
- ✅ 祝日データはGAS経由ではなく holidays-jp の公開APIから直接取得

### URL構成
| 旧 | 新 |
|---|---|
| `?group=xxx&gn=名前` | `/g/xxx` （グループ名はFirestoreに保存。タイトルタップで設定） |
| `?id=xxx&t=...&tg=...&ro=...&m=...` | `/e/xxx` |
| （新規作成） | `/` または `/g/xxx/new` |

---

## 🚀 セットアップ手順

### 1. このフォルダを展開して依存をインストール
```powershell
cd syncact
npm install
```

### 2. `.env` を作成
`.env.example` をコピーして `.env` にリネームし、Firebaseコンソールでコピーした
`firebaseConfig` の値を貼り付ける：

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=syncact.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=syncact
VITE_FIREBASE_STORAGE_BUCKET=syncact.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123...
```

> ⚠️ `.env` はGitにコミットしない（`.gitignore` に追加済み）

### 3. Firestoreのインデックス作成（重要）
初回起動時、コンソールに「The query requires an index」エラーが出たら、
**エラーメッセージ内のリンクをクリック**するだけで自動作成されます。
（`events`: groupId + createdAt、`responses`: activityId + createdAt の複合インデックス）

### 4. Firestoreセキュリティルール
Firebaseコンソール → Firestore → ルール に貼り付け：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{id} { allow read, write: if true; }
    match /responses/{id} { allow read, write: if true; }
    match /presets/{id} { allow read, write: if true; }
    match /groups/{id} { allow read, write: if true; }
  }
}
```

> ⚠️ 注意: ログインなし運用のため全開放ルールです。URLを知っている人なら誰でも
> 読み書きできます。クローズドな仲間内利用が前提。パスコードはUI上の修正ガードで
> あり、悪意ある人への防御にはなりません（その場合はFirebase Auth匿名認証の導入を検討）。

### 5. ローカルで起動
```powershell
npm run dev
```

### 6. プリセットの登録（任意）
Firebaseコンソール → Firestore → `presets` コレクションに手動追加するか、
イベント作成画面の「この内容をプリセットとして保存」チェックボックスで登録。

ドキュメント形式：
```
label: "週末キャンプ"（選択肢に表示される名前）
title: "週末キャンプ"
tags: ["🚗", "🍖"]（配列）
roles: ["ドライバー", "買い出し"]（配列）
```

---

## 📦 Vercelへのデプロイ

1. GitHubにpush（既存リポジトリでOK。中身をこのプロジェクトに置き換え）
2. Vercelのプロジェクト設定 → Environment Variables に `.env` と同じ6つの変数を登録
3. Framework Preset: **Vite**（自動検出されるはず）
4. `vercel.json` 同梱済み（react-routerの直リンクアクセス対応）

---

## 🗂️ 旧データの移行（任意）

スプシの既存データを移したい場合は、各イベントをFirestoreコンソールから手動で
`events` コレクションに追加してください。列の対応：

| スプシ列 | Firestoreフィールド | 備考 |
|---|---|---|
| A: groupId | groupId | string |
| B: activityId | （ドキュメントID） | |
| C: title | title | string |
| D: desc | desc | string |
| E: tags | tags | **配列に変換** ["🚗","🍖"] |
| F: dateRule | （廃止） | 使われていなかったため |
| G: roles | roles | **配列に変換** |
| H: createdAt | createdAt | timestamp |
| I: memo | memo | string |
| J: fixedDate | fixedDate | string or null |

回答データは件数が少なければ再回答してもらう方が早いです
（パスコード設定も必要になるため）。

---

## 📁 ファイル構成

```
syncact/
├── index.html              # Tailwind CDN読み込み
├── vercel.json             # SPAリライト設定
├── .env.example            # 環境変数テンプレ
├── src/
│   ├── main.jsx            # エントリポイント
│   ├── App.jsx             # ルーティング
│   ├── index.css           # flatpickrカスタム（祝日/BEST日/確定日）
│   ├── lib/
│   │   ├── firebase.js     # Firebase初期化
│   │   ├── db.js           # Firestore操作（全DB処理はここ）
│   │   ├── holidays.js     # 祝日API取得＋キャッシュ
│   │   └── utils.js        # 日付フォーマット等（祝日ズレ修正含む）
│   ├── components/
│   │   ├── PasscodeModal.jsx
│   │   ├── MemoCard.jsx
│   │   ├── DateSummary.jsx # 日程候補＋確定＋BESTハイライト
│   │   ├── ResponseList.jsx
│   │   └── LoadingOverlay.jsx
│   └── pages/
│       ├── CreatePage.jsx  # イベント作成（/ と /g/:groupId/new）
│       ├── GroupPage.jsx   # 一覧＋アーカイブ（/g/:groupId）
│       └── EventPage.jsx   # 回答画面（/e/:activityId）
```
