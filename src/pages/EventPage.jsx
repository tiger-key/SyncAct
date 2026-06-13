import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import flatpickr from 'flatpickr';
import { Japanese } from 'flatpickr/dist/l10n/ja.js';
import {
  listenEvent, listenResponses, updateEventMemo, updateEventCover,
  setFixedDate, setEventStatus, copyEvent, submitResponse, updateResponse,
  deleteResponse, verifyPasscode,
} from '../lib/db';
import { fmtDateLocal } from '../lib/utils';
import { resizeImage } from '../lib/covers';
import EventCover from '../components/EventCover';
import MemoCard from '../components/MemoCard';
import DateSummary from '../components/DateSummary';
import ResponseList from '../components/ResponseList';
import PasscodeModal from '../components/PasscodeModal';
import LoadingOverlay from '../components/LoadingOverlay';
import { getHolidays } from '../lib/holidays';

export default function EventPage() {
  const { activityId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(undefined);
  const [responses, setResponses] = useState([]);
  const [name, setName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [editingResponse, setEditingResponse] = useState(null);
  const [modal, setModal] = useState(null);
  const [modalError, setModalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const pickerRef = useRef(null);
  const fpRef = useRef(null);
  const holidaysRef = useRef({});
  const countsRef = useRef({ counts: {}, max: 0 });
  const fixedRef = useRef(null);

  useEffect(() => listenEvent(activityId, setEvent), [activityId]);
  useEffect(() => listenResponses(activityId, setResponses), [activityId]);

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

  // 【カレンダー不具合の修正】
  // 旧コードはマウント直後のeffectでflatpickrを初期化していたが、
  // その時点ではイベント読込中で input がレンダリングされておらず ref が null だった。
  // → event が読み込まれて input が描画された後に初期化するよう依存配列を修正。
  useEffect(() => {
    if (!event || !pickerRef.current || fpRef.current) return;
    let cancelled = false;
    (async () => {
      holidaysRef.current = await getHolidays();
      if (cancelled || !pickerRef.current || fpRef.current) return;

      const opts = {
        mode: 'multiple',
        locale: Japanese,
        dateFormat: 'Y-m-d',
        onChange: (dates) => setSelectedDates(dates.map(fmtDateLocal)),
        onDayCreate: (dObj, dStr, fp, dayElem) => {
          const dateStr = fmtDateLocal(dayElem.dateObj);
          if (holidaysRef.current[dateStr]) dayElem.classList.add('holiday');
          const { counts, max } = countsRef.current;
          if (max >= 2 && counts[dateStr] === max) dayElem.classList.add('hot');
          if (fixedRef.current === dateStr) dayElem.classList.add('fixedday');
        },
      };

      fpRef.current = flatpickr(pickerRef.current, opts);

      // 候補月が指定されていればその月を初期表示
      if (event.targetMonth) {
        const [y, m] = event.targetMonth.split('-').map(Number);
        fpRef.current.jumpToDate(new Date(y, m - 1, 1));
      }
      fpRef.current.redraw();
    })();
    return () => { cancelled = true; };
  }, [event]);

  // アンマウント時にflatpickrを破棄
  useEffect(() => () => { fpRef.current?.destroy(); fpRef.current = null; }, []);

  if (event === undefined) {
    return <p className="text-center py-12 text-gray-400 font-bold">読み込み中...</p>;
  }
  if (event === null) {
    return <p className="text-center py-12 text-gray-400 font-black">イベントが見つかりません 🫥</p>;
  }

  const toggleRole = (role) => {
    setSelectedRoles((rs) =>
      rs.includes(role) ? rs.filter((x) => x !== role) : [...rs, role]
    );
  };

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
      const pendingStatus = modal.pendingStatus;
      setModal(null);
      setLoading(true);
      try {
        await submitResponse({
          activityId,
          name: name.trim(),
          dates: pendingStatus === 'unavailable' ? [] : selectedDates,
          roles: selectedRoles,
          status: pendingStatus,
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
      const r = modal.target;
      if (!r.passcodeHash) {
        setModalError('この回答は旧データのため修正できません 🙏');
        return;
      }
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

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const dataUrl = await resizeImage(file);
      await updateEventCover(activityId, dataUrl);
    } catch (err) {
      alert('画像のアップロードに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(location.href);
    alert('コピーしました！');
  };

  if (done) {
    return (
      <div className="space-y-8 animate-in text-center pt-10">
        <div className="glass p-10">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-2xl font-black mb-2" style={{ letterSpacing: '-0.8px' }}>送信完了！</h2>
          <p className="text-xs text-gray-400 font-bold">パスコードは忘れないでね 🔐</p>
          <div className="grid gap-3 mt-6">
            <button onClick={() => setDone(false)} className="btn-dark w-full py-4 text-base" style={{ borderRadius: 18 }}>
              回答状況を見る
            </button>
            <button onClick={() => navigate(`/g/${event.groupId}`)} className="btn-soft w-full py-4 text-base" style={{ borderRadius: 18 }}>
              一覧へ戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in pb-12">
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

      {/* カバーヘッダー */}
      <div className="glass overflow-hidden">
        <div className="relative">
          <EventCover ev={event} height={170} className="text-[64px]">
            <div className="cf-label" style={{ padding: '50px 18px 16px' }}>
              <div className="flex gap-1.5 flex-wrap mb-1.5">
                {(event.tags || []).map((t, i) => (
                  <span key={i} className="pill" style={{ background: 'rgba(255,255,255,0.22)', color: '#fff' }}>{t}</span>
                ))}
              </div>
              <div className="font-black text-white" style={{ fontSize: 22, letterSpacing: '-0.8px', lineHeight: 1.15 }}>
                {event.title}
              </div>
            </div>
          </EventCover>
          <label className="absolute top-3 right-3 cursor-pointer rounded-full px-3 py-1.5 text-[9px] font-black uppercase"
            style={{ background: 'rgba(0,0,0,0.4)', color: '#fff', backdropFilter: 'blur(8px)' }}>
            📷 変更
            <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
          </label>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between rounded-2xl px-4 py-2.5" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <span className="text-[10px] font-mono text-gray-400 truncate mr-3">{location.href}</span>
            <button onClick={copyUrl} className="text-[10px] font-black uppercase bg-transparent border-0 cursor-pointer shrink-0" style={{ color: '#111' }}>
              コピー
            </button>
          </div>
          <div className="flex gap-2 mt-2.5">
            <button onClick={handleArchive} className="btn-soft flex-1 py-2 text-[10px]">📦 アーカイブ</button>
            <button onClick={handleCopy} className="btn-soft flex-1 py-2 text-[10px]">📋 コピー</button>
          </div>
        </div>
      </div>

      {/* 共有メモ */}
      <MemoCard memo={event.memo} onSave={(m) => updateEventMemo(activityId, m)} />

      {/* 日程候補 */}
      <DateSummary
        responses={responses}
        fixedDate={event.fixedDate}
        onFix={(d) => { if (confirm(`${d} で確定する？`)) setFixedDate(activityId, d); }}
        onUnfix={() => { if (confirm('確定を解除する？')) setFixedDate(activityId, null); }}
      />

      {/* 回答フォーム */}
      <div className="glass p-6 space-y-5"
        style={editingResponse ? { outline: '2px solid #d4a017', outlineOffset: -2 } : {}}>
        {editingResponse && (
          <div className="rounded-2xl p-3 flex justify-between items-center animate-in"
            style={{ background: 'rgba(212,160,23,0.12)' }}>
            <span className="text-[11px] font-black" style={{ color: '#9a7209' }}>
              ✏️ {editingResponse.name} さんの回答を修正中
            </span>
            <button onClick={resetForm} className="btn-soft text-[10px] px-3 py-1">やめる</button>
          </div>
        )}

        <div>
          <label className="sec-label block mb-2">お名前</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!!editingResponse}
            type="text"
            placeholder="なまえを入力"
            className="input-soft"
            style={{ fontSize: 17, fontWeight: 800, opacity: editingResponse ? 0.6 : 1 }}
          />
        </div>

        {(event.roles || []).length > 0 && (
          <div>
            <label className="sec-label block mb-2">担当できる役割</label>
            <div className="flex flex-wrap gap-2">
              {event.roles.map((role) => {
                const active = selectedRoles.includes(role);
                return (
                  <button key={role} onClick={() => toggleRole(role)}
                    className={active ? 'btn-dark px-4 py-2 text-[11px]' : 'btn-soft px-4 py-2 text-[11px]'}>
                    {role}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="sec-label">空いてる日</label>
            <button onClick={() => startSubmit('unavailable')}
              className="text-[10px] font-black uppercase bg-transparent border-0 cursor-pointer"
              style={{ color: '#c0392b' }}>
              不参加 ✕
            </button>
          </div>
          <input
            ref={pickerRef}
            type="text"
            placeholder="カレンダーを開く 📅"
            readOnly
            className="input-soft cursor-pointer"
          />
          <p className="text-[9px] text-gray-400 font-bold mt-1.5 px-1">
            ⬛ みんな空いてる日 / 🔴 祝日 / 枠 = 確定日
          </p>
        </div>

        <div className="space-y-2">
          <button onClick={() => startSubmit('available')}
            className="btn-dark w-full py-5 text-base" style={{ borderRadius: 18 }}>
            {editingResponse ? '修正を保存する 💾' : '送信する ✉️'}
          </button>
          {editingResponse && (
            <button onClick={handleDelete}
              className="w-full py-3 rounded-2xl font-black text-xs border-0 cursor-pointer"
              style={{ background: 'rgba(192,57,43,0.08)', color: '#c0392b' }}>
              この回答を削除する 🗑️
            </button>
          )}
        </div>
      </div>

      {/* 回答状況 */}
      <ResponseList responses={responses} onTapResponse={handleTapResponse} />
    </div>
  );
}
