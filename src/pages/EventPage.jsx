import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import flatpickr from 'flatpickr';
import { Japanese } from 'flatpickr/dist/l10n/ja.js';
import {
  listenEvent, listenResponses, updateEventMemo, setFixedDate,
  setEventStatus, copyEvent, submitResponse, updateResponse,
  deleteResponse, verifyPasscode,
} from '../lib/db';
import { fmtDateLocal } from '../lib/utils';
import MemoCard from '../components/MemoCard';
import DateSummary from '../components/DateSummary';
import ResponseList from '../components/ResponseList';
import PasscodeModal from '../components/PasscodeModal';
import LoadingOverlay from '../components/LoadingOverlay';
import { getHolidays } from '../lib/holidays';

export default function EventPage() {
  const { activityId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(undefined); // undefined=読込中, null=なし
  const [responses, setResponses] = useState([]);
  const [name, setName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [editingResponse, setEditingResponse] = useState(null); // 修正対象
  const [modal, setModal] = useState(null); // { mode, target?, pendingStatus? }
  const [modalError, setModalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const pickerRef = useRef(null);
  const fpRef = useRef(null);
  const holidaysRef = useRef({});
  const countsRef = useRef({ counts: {}, max: 0 });
  const fixedRef = useRef(null);

  // リアルタイム購読
  useEffect(() => listenEvent(activityId, setEvent), [activityId]);
  useEffect(() => listenResponses(activityId, setResponses), [activityId]);

  // 集計（カレンダーハイライト用）
  useEffect(() => {
    const counts = {};
    responses
      .filter((r) => r.status === 'available')
      .forEach((r) => (r.dates || []).forEach((d) => { counts[d] = (counts[d] || 0) + 1; }));
    const max = Math.max(0, ...Object.values(counts));
    countsRef.current = { counts, max };
    fpRef.current?.redraw();
  }, [responses]);

  useEffect(() => {
    fixedRef.current = event?.fixedDate || null;
    fpRef.current?.redraw();
  }, [event?.fixedDate]);

  // flatpickr 初期化
  useEffect(() => {
    let cancelled = false;
    (async () => {
      holidaysRef.current = await getHolidays();
      if (cancelled || !pickerRef.current) return;
      fpRef.current = flatpickr(pickerRef.current, {
        mode: 'multiple',
        locale: Japanese,
        dateFormat: 'Y-m-d',
        onChange: (dates) => setSelectedDates(dates.map(fmtDateLocal)),
        onDayCreate: (dObj, dStr, fp, dayElem) => {
          // 【修正】toISOString()はUTC変換で日付がずれるため、ローカル日付でフォーマット
          const dateStr = fmtDateLocal(dayElem.dateObj);
          if (holidaysRef.current[dateStr]) dayElem.classList.add('holiday');
          const { counts, max } = countsRef.current;
          if (max >= 2 && counts[dateStr] === max) dayElem.classList.add('hot');
          if (fixedRef.current === dateStr) dayElem.classList.add('fixedday');
        },
      });
      fpRef.current.redraw();
    })();
    return () => {
      cancelled = true;
      fpRef.current?.destroy();
      fpRef.current = null;
    };
  }, [activityId]);

  if (event === undefined) {
    return <p className="text-center py-12 text-gray-300 font-bold">読み込み中...</p>;
  }
  if (event === null) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-gray-400 font-black">イベントが見つかりません 🫥</p>
      </div>
    );
  }

  const toggleRole = (role) => {
    setSelectedRoles((rs) =>
      rs.includes(role) ? rs.filter((x) => x !== role) : [...rs, role]
    );
  };

  // ===== 送信フロー =====
  const startSubmit = (status) => {
    if (!name.trim()) return alert('お名前を入れてね');
    if (status === 'available' && !selectedDates.length) return alert('日付を選んでね');
    if (editingResponse) {
      saveEdit(status);
    } else {
      setModalError('');
      setModal({ mode: 'set', pendingStatus: status });
    }
  };

  const handlePasscodeSubmit = async (code) => {
    if (modal.mode === 'set') {
      // 新規回答
      setModal(null);
      setLoading(true);
      try {
        await submitResponse({
          activityId,
          name: name.trim(),
          dates: modal.pendingStatus === 'unavailable' ? [] : selectedDates,
          roles: selectedRoles,
          status: modal.pendingStatus,
          passcode: code,
        });
        setDone(true);
      } catch (e) {
        console.error(e);
        alert('送信に失敗しました');
      } finally {
        setLoading(false);
      }
    } else {
      // 本人確認 → 編集モードへ
      const r = modal.target;
      if (!verifyPasscode(r, code)) {
        setModalError('パスコードが違うみたい 🤔');
        return;
      }
      setModal(null);
      setEditingResponse(r);
      setName(r.name);
      setSelectedRoles(r.roles || []);
      setSelectedDates(r.dates || []);
      fpRef.current?.setDate(r.dates || [], false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const saveEdit = async (status) => {
    setLoading(true);
    try {
      await updateResponse(editingResponse.id, {
        dates: status === 'unavailable' ? [] : selectedDates,
        roles: selectedRoles,
        status,
      });
      resetForm();
      setDone(true);
    } catch (e) {
      console.error(e);
      alert('更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('この回答を削除する？')) return;
    setLoading(true);
    try {
      await deleteResponse(editingResponse.id);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingResponse(null);
    setName('');
    setSelectedRoles([]);
    setSelectedDates([]);
    fpRef.current?.clear();
  };

  const handleTapResponse = (r) => {
    setModalError('');
    setModal({ mode: 'verify', target: r });
  };

  // ===== イベント操作 =====
  const handleArchive = async () => {
    if (!confirm(`「${event.title}」をアーカイブする？`)) return;
    await setEventStatus(activityId, 'archived');
    navigate(`/g/${event.groupId}`);
  };

  const handleCopy = async () => {
    if (!confirm('このイベントをコピーして新規作成する？')) return;
    const newId = await copyEvent(event);
    navigate(`/e/${newId}`);
    window.scrollTo(0, 0);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(location.href);
    alert('コピーしました！');
  };

  // ===== 完了画面 =====
  if (done) {
    return (
      <div className="space-y-8 animate-in text-center pt-10">
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">送信完了！</h2>
          <p className="text-xs text-gray-400 font-bold">パスコードは忘れないでね 🔐</p>
          <div className="grid gap-3 mt-6">
            <button
              onClick={() => setDone(false)}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-md shadow-lg"
            >
              回答状況を見る
            </button>
            <button
              onClick={() => navigate(`/g/${event.groupId}`)}
              className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-black text-md"
            >
              一覧へ戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in pb-12">
      {loading && <LoadingOverlay />}
      {modal && (
        <PasscodeModal
          mode={modal.mode}
          name={modal.target?.name}
          error={modalError}
          onSubmit={handlePasscodeSubmit}
          onClose={() => setModal(null)}
        />
      )}

      {/* ヘッダーカード */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-t-[12px] border-blue-600">
        <div className="flex flex-wrap gap-2 mb-3">
          {(event.tags || []).map((t, i) => (
            <span key={i} className="px-3 py-1 text-[11px] font-black bg-blue-100 text-blue-700 rounded-md shadow-sm uppercase">{t}</span>
          ))}
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">{event.title}</h2>
        <div className="mt-4 p-3 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100">
          <span className="text-[10px] font-mono text-gray-400 truncate mr-3">{location.href}</span>
          <button onClick={copyUrl} className="text-xs font-black text-blue-600 hover:text-blue-800 uppercase shrink-0">コピー</button>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleArchive} className="flex-1 text-[10px] font-black text-gray-400 bg-gray-50 py-2 rounded-xl">📦 アーカイブ</button>
          <button onClick={handleCopy} className="flex-1 text-[10px] font-black text-blue-500 bg-blue-50 py-2 rounded-xl">📋 コピー</button>
        </div>
      </div>

      {/* 共有メモ */}
      <MemoCard memo={event.memo} onSave={(m) => updateEventMemo(activityId, m)} />

      {/* 日程候補・確定 */}
      <DateSummary
        responses={responses}
        fixedDate={event.fixedDate}
        onFix={(d) => {
          if (confirm(`${d} で確定する？`)) setFixedDate(activityId, d);
        }}
        onUnfix={() => {
          if (confirm('確定を解除する？')) setFixedDate(activityId, null);
        }}
      />

      {/* 回答フォーム */}
      <div className={`bg-white p-7 rounded-[2.5rem] shadow-xl space-y-6 border ${editingResponse ? 'border-amber-300 ring-2 ring-amber-200' : 'border-gray-100'}`}>
        {editingResponse && (
          <div className="bg-amber-50 p-3 rounded-2xl flex justify-between items-center animate-in">
            <span className="text-[11px] font-black text-amber-700">✏️ {editingResponse.name} さんの回答を修正中</span>
            <button onClick={resetForm} className="text-[10px] font-black text-gray-400 bg-white px-3 py-1 rounded-full">やめる</button>
          </div>
        )}
        <div>
          <label className="text-[11px] font-black text-gray-400 mb-2 block uppercase">お名前</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!!editingResponse}
            type="text"
            placeholder="なまえを入力"
            className="w-full p-4 bg-gray-100 rounded-2xl outline-none font-extrabold text-lg disabled:opacity-60"
          />
        </div>
        {(event.roles || []).length > 0 && (
          <div className="space-y-3">
            <label className="text-[11px] font-black text-gray-400 uppercase">担当できる役割</label>
            <div className="flex flex-wrap gap-2">
              {event.roles.map((role) => {
                const active = selectedRoles.includes(role);
                return (
                  <div
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`px-4 py-2 rounded-full text-[11px] font-black cursor-pointer transition-all border-2 ${
                      active
                        ? 'bg-blue-500 text-white border-blue-600'
                        : 'bg-gray-100 text-gray-500 border-transparent'
                    }`}
                  >
                    {role}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div>
          <div className="flex justify-between items-center mb-2 px-1">
            <label className="text-[11px] font-black text-gray-400 uppercase">空いてる日</label>
            <button
              onClick={() => startSubmit('unavailable')}
              className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-md border border-rose-100"
            >
              不参加 ❌
            </button>
          </div>
          <input
            ref={pickerRef}
            type="text"
            placeholder="カレンダーを開く 📅"
            readOnly
            className="w-full p-4 bg-gray-100 rounded-2xl outline-none cursor-pointer font-bold text-blue-600"
          />
          <p className="text-[9px] text-gray-300 font-bold mt-1.5 px-1">
            🟢 みんな空いてる日 / 🔴 祝日 / 赤塗り = 確定日
          </p>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => startSubmit('available')}
            className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-black active:scale-95 transition-transform"
          >
            {editingResponse ? '修正を保存する 💾' : '送信する ✉️'}
          </button>
          {editingResponse && (
            <button
              onClick={handleDelete}
              className="w-full bg-rose-50 text-rose-500 py-3 rounded-2xl font-black text-xs border border-rose-100"
            >
              この回答を削除する 🗑️
            </button>
          )}
        </div>
      </div>

      {/* 回答状況（リアルタイム） */}
      <ResponseList responses={responses} onTapResponse={handleTapResponse} />
    </div>
  );
}
