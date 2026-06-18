import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import flatpickr from 'flatpickr';
import { Japanese } from 'flatpickr/dist/l10n/ja.js';
import {
  listenEvent, listenResponses, updateEventMemo, updateEventCover, updateEventInfo,
  setFixedDate, setEventStatus, copyEvent, submitResponse, updateResponse,
  deleteResponse, verifyPasscode,
} from '../lib/db';
import { fmtDateLocal, formatDateJa } from '../lib/utils';
import { resizeImage } from '../lib/covers';
import EventCover from '../components/EventCover';
import MemoCard from '../components/MemoCard';
import DateSummary from '../components/DateSummary';
import ResponseList from '../components/ResponseList';
import InviteResponseList from '../components/InviteResponseList';
import CommentGateModal from '../components/CommentGateModal';
import PasscodeModal from '../components/PasscodeModal';
import EditEventModal from '../components/EditEventModal';
import LoadingOverlay from '../components/LoadingOverlay';
import { getHolidays } from '../lib/holidays';

function fmtFixed(fd) {
  if (!fd) return null;
  return fd.includes('-') && fd.length === 10 ? formatDateJa(fd) : fd;
}

export default function EventPage() {
  const { activityId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(undefined);
  const [responses, setResponses] = useState([]);
  const [name, setName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [comment, setComment] = useState('');
  const [invitedBy, setInvitedBy] = useState('');
  const [editingResponse, setEditingResponse] = useState(null);
  const [modal, setModal] = useState(null);
  const [modalError, setModalError] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentsUnlocked, setCommentsUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const pickerRef = useRef(null);
  const fpRef = useRef(null);
  const holidaysRef = useRef({});
  const countsRef = useRef({ counts: {}, max: 0 });
  const fixedRef = useRef(null);

  const isInvite = event && event.eventMode === 'invite';

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

  // カレンダー初期化（日程調整モードのみ・イベント読込後）
  useEffect(() => {
    if (!event || isInvite || !pickerRef.current || fpRef.current) return;
    let cancelled = false;
    (async () => {
      holidaysRef.current = await getHolidays();
      if (cancelled || !pickerRef.current || fpRef.current) return;
      fpRef.current = flatpickr(pickerRef.current, {
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
      });
      if (event.targetMonth) {
        const [y, m] = event.targetMonth.split('-').map(Number);
        fpRef.current.jumpToDate(new Date(y, m - 1, 1));
      }
      fpRef.current.redraw();
    })();
    return () => { cancelled = true; };
  }, [event, isInvite]);

  useEffect(() => () => { fpRef.current?.destroy(); fpRef.current = null; }, []);

  if (event === undefined) {
    return <p className="text-center py-12 text-gray-400 font-bold">読み込み中...</p>;
  }
  if (event === null) {
    return <p className="text-center py-12 text-gray-400 font-black">イベントが見つかりません 🫥</p>;
  }

  const toggleRole = (role) => {
    setSelectedRoles((rs) => rs.includes(role) ? rs.filter((x) => x !== role) : [...rs, role]);
  };

  // 送信開始（status: available / unavailable）
  const startSubmit = (status) => {
    if (!name.trim()) return alert('お名前を入れてね');
    if (!isInvite && status === 'available' && !selectedDates.length) return alert('日付を選んでね');
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
          comment,
          invitedBy,
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
      setComment(r.comment || '');
      setInvitedBy(r.invitedBy || '');
      if (!isInvite) fpRef.current?.setDate(r.dates || [], false);
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
        comment,
        invitedBy,
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
    setComment('');
    setInvitedBy('');
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

  // 手動で確定日を設定（回答候補がなくても直接入力）
  const handleManualFix = () => {
    const cur = event.fixedDate || '';
    const input = prompt('確定日を入力（例: 2026-07-19 または 7/19（土）など自由形式）', cur);
    if (input === null) return;
    setFixedDate(activityId, input.trim() || null);
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
              {isInvite ? '参加状況を見る' : '回答状況を見る'}
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
      {showEdit && (
        <EditEventModal
          event={event}
          onSave={(fields) => updateEventInfo(activityId, fields)}
          onClose={() => setShowEdit(false)}
        />
      )}
      {showCommentModal && !commentsUnlocked && (
        <CommentGateModal
          event={event}
          responses={responses}
          onUnlock={() => { setCommentsUnlocked(true); setShowCommentModal(false); }}
          onClose={() => setShowCommentModal(false)}
        />
      )}

      {/* カバーヘッダー */}
      <div className="glass overflow-hidden">
        <div className="relative">
          <EventCover ev={event} height={170} className="text-[64px]">
            <div className="cf-label" style={{ padding: '50px 18px 16px' }}>
              <div className="flex gap-1.5 flex-wrap mb-1.5">
                {isInvite && <span className="pill" style={{ background: 'rgba(255,255,255,0.3)', color: '#fff' }}>🎉 イベント</span>}
                {(event.tags || []).map((t, i) => (
                  <span key={i} className="pill" style={{ background: 'rgba(255,255,255,0.22)', color: '#fff' }}>{t}</span>
                ))}
              </div>
              <div className="font-black text-white" style={{ fontSize: 22, letterSpacing: '-0.8px', lineHeight: 1.15 }}>
                {event.title}
              </div>
              {event.fixedDate && (
                <div className="text-white text-xs font-bold mt-1" style={{ opacity: 0.85 }}>
                  📍 {fmtFixed(event.fixedDate)}
                </div>
              )}
            </div>
          </EventCover>
          <div className="absolute top-3 right-3 flex gap-2">
            <button onClick={() => setShowEdit(true)}
              className="cursor-pointer rounded-full px-3 py-1.5 text-[9px] font-black uppercase border-0"
              style={{ background: 'rgba(0,0,0,0.4)', color: '#fff', backdropFilter: 'blur(8px)' }}>
              ✏️ 編集
            </button>
            <label className="cursor-pointer rounded-full px-3 py-1.5 text-[9px] font-black uppercase"
              style={{ background: 'rgba(0,0,0,0.4)', color: '#fff', backdropFilter: 'blur(8px)' }}>
              📷
              <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
            </label>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between rounded-2xl px-4 py-2.5" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <span className="text-[10px] font-mono text-gray-400 truncate mr-3">{location.href}</span>
            <button onClick={copyUrl} className="text-[10px] font-black uppercase bg-transparent border-0 cursor-pointer shrink-0" style={{ color: '#111' }}>
              コピー
            </button>
          </div>
          <div className="flex gap-2 mt-2.5">
            <button onClick={handleManualFix} className="btn-soft flex-1 py-2 text-[10px]">📍 確定日</button>
            <button onClick={handleArchive} className="btn-soft flex-1 py-2 text-[10px]">📦 アーカイブ</button>
            <button onClick={handleCopy} className="btn-soft flex-1 py-2 text-[10px]">📋 コピー</button>
          </div>
          {isInvite && (
            <button onClick={() => setShowCommentModal(true)}
              className="btn-dark w-full py-3 text-sm mt-2" style={{ borderRadius: 16 }}>
              💬 ゲストコメント
            </button>
          )}
        </div>
      </div>

      {/* 共有メモ */}
      <MemoCard memo={event.memo} onSave={(m) => updateEventMemo(activityId, m)} />

{/* 日程候補（日程調整モードのみ） */}
      {!isInvite && (
        <DateSummary
          responses={responses}
          fixedDate={event.fixedDate}
          onFix={(d) => { if (confirm(`${d} で確定する？`)) setFixedDate(activityId, d); }}
          onUnfix={() => { if (confirm('確定を解除する？')) setFixedDate(activityId, null); }}
        />
      )}

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

        {/* 役割（日程調整モードのみ） */}
        {!isInvite && (event.roles || []).length > 0 && (
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

        {/* カレンダー（日程調整モードのみ） */}
        {!isInvite && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="sec-label">空いてる日</label>
              <button onClick={() => startSubmit('unavailable')}
                className="text-[10px] font-black uppercase bg-transparent border-0 cursor-pointer"
                style={{ color: '#c0392b' }}>
                不参加 ✕
              </button>
            </div>
            <input ref={pickerRef} type="text" placeholder="カレンダーを開く 📅" readOnly className="input-soft cursor-pointer" />
            <p className="text-[9px] text-gray-400 font-bold mt-1.5 px-1">
              ⬛ みんな空いてる日 / 🔴 祝日 / 枠 = 確定日
            </p>
          </div>
        )}

        {/* 一言コメント */}
        <div>
          <label className="sec-label block mb-2">一言コメント（任意）</label>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            type="text"
            placeholder={isInvite ? '「遅れて参加します」など' : '「夜なら空いてます」など'}
            className="input-soft"
          />
        </div>

        {/* 招待者名（invite mode） */}
        {isInvite && (
          <div>
            <label className="sec-label block mb-2">誰に招待されたか</label>
            <input
              value={invitedBy}
              onChange={(e) => setInvitedBy(e.target.value)}
              type="text"
              placeholder="招待者の名前など"
              className="input-soft"
            />
            <p className="text-[10px] text-gray-400 font-bold mt-1.5 px-1">
              みんなに見えます
            </p>
          </div>
        )}

        {/* 送信ボタン */}
        {isInvite ? (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => startSubmit('available')}
              className="btn-dark py-5 text-base" style={{ borderRadius: 18 }}>
              参加する ✅
            </button>
            <button onClick={() => startSubmit('unavailable')}
              className="py-5 text-base rounded-[18px] font-black border-0 cursor-pointer"
              style={{ background: 'rgba(0,0,0,0.06)', color: '#777' }}>
              不参加 ✕
            </button>
          </div>
        ) : (
          <button onClick={() => startSubmit('available')}
            className="btn-dark w-full py-5 text-base" style={{ borderRadius: 18 }}>
            {editingResponse ? '修正を保存する 💾' : '送信する ✉️'}
          </button>
        )}

        {editingResponse && isInvite && (
          <button onClick={() => saveEdit(editingResponse.status)}
            className="btn-dark w-full py-3 text-xs" style={{ borderRadius: 14 }}>
            コメントだけ更新 💾
          </button>
        )}

        {editingResponse && (
          <button onClick={handleDelete}
            className="w-full py-3 rounded-2xl font-black text-xs border-0 cursor-pointer"
            style={{ background: 'rgba(192,57,43,0.08)', color: '#c0392b' }}>
            この回答を削除する 🗑️
          </button>
        )}
      </div>

      {/* 回答状況 */}
      {isInvite
        ? <InviteResponseList responses={responses} onTapResponse={handleTapResponse} onViewComments={() => setShowCommentModal(true)} />
        : <ResponseList responses={responses} onTapResponse={handleTapResponse} />}
    </div>
  );
}
