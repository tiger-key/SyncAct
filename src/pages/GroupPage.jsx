import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  listenGroupEvents, listenResponses, setEventStatus, copyEvent,
  getGroup, setGroupName,
} from '../lib/db';
import EventCover from '../components/EventCover';
import { LogoMark } from '../components/Logo';
import { formatDateJa } from '../lib/utils';

function fmtFixed(fd) {
  if (!fd) return null;
  return fd.includes('-') && fd.length === 10 ? formatDateJa(fd) : fd;
}

// グリッドカード内の参加者チップ
function ParticipantChips({ activityId }) {
  const [responses, setResponses] = useState([]);
  useEffect(() => listenResponses(activityId, setResponses), [activityId]);
  if (!responses.length) return null;
  return (
    <div className="flex gap-1 flex-wrap mt-2">
      {responses.map((r) => (
        <div key={r.id}
          className="rounded-full flex items-center justify-center font-black"
          style={{
            width: 22, height: 22, fontSize: 8,
            background: 'rgba(0,0,0,0.07)', color: '#444',
            opacity: r.status === 'unavailable' ? 0.25 : 1,
          }}
          title={r.name}>
          {r.name.slice(0, 1)}
        </div>
      ))}
    </div>
  );
}

export default function GroupPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState(null);
  const [groupName, setGroup] = useState('');
  const [view, setView] = useState('cf'); // 'cf' | 'grid'
  const [center, setCenter] = useState(0);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const unsub = listenGroupEvents(groupId, setEvents);
    getGroup(groupId).then((g) => g?.name && setGroup(g.name));
    return unsub;
  }, [groupId]);

  const active = (events || []).filter((e) => e.status !== 'archived');
  const archived = (events || []).filter((e) => e.status === 'archived');

  useEffect(() => {
    if (center >= active.length) setCenter(Math.max(0, active.length - 1));
  }, [active.length, center]);

  const editGroupName = async () => {
    const name = prompt('グループ名を入力', groupName);
    if (name === null) return;
    await setGroupName(groupId, name);
    setGroup(name);
  };

  const handleArchiveToggle = async (ev) => {
    const next = ev.status === 'archived' ? 'active' : 'archived';
    if (next === 'archived' && !confirm(`「${ev.title}」をアーカイブする？`)) return;
    await setEventStatus(ev.id, next);
  };

  const handleCopy = async (ev) => {
    if (!confirm(`「${ev.title}」をコピーして新しいイベントを作る？`)) return;
    const newId = await copyEvent(ev);
    navigate(`/e/${newId}`);
  };

  const centerEv = active[center];

  return (
    <div className="animate-in pb-12">
      {/* ヘッダー */}
      <div className="flex justify-between items-start mb-7 px-1">
        <div>
          <div className="flex items-center gap-1.5">
            <LogoMark size={16} />
            <span className="text-sm font-black" style={{ color: '#163f5d', letterSpacing: '-0.3px' }}>
              KAREN
            </span>
          </div>
          <div onClick={editGroupName}
            className="font-black cursor-pointer"
            style={{ fontSize: 28, letterSpacing: '-1.5px', lineHeight: 1, marginTop: 4 }}>
            {groupName || 'グループ'}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 mt-1">
          <button onClick={() => navigate(`/g/${groupId}/new`)}
            className="btn-dark px-5 py-2 text-xs">＋ 新規作成</button>
          <div className="flex rounded-xl p-0.5 gap-0.5" style={{ background: 'rgba(0,0,0,0.07)' }}>
            <button onClick={() => setView('cf')}
              className="rounded-lg px-2.5 py-1 text-sm border-0 cursor-pointer"
              style={view === 'cf'
                ? { background: '#fff', color: '#111', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }
                : { background: 'none', color: '#999' }}>◫</button>
            <button onClick={() => setView('grid')}
              className="rounded-lg px-2.5 py-1 text-sm border-0 cursor-pointer"
              style={view === 'grid'
                ? { background: '#fff', color: '#111', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }
                : { background: 'none', color: '#999' }}>⊞</button>
          </div>
        </div>
      </div>

      {events === null && (
        <p className="text-center py-12 text-gray-400 text-sm font-bold">読み込み中...</p>
      )}
      {events !== null && !active.length && (
        <p className="text-center py-12 text-gray-400 text-sm font-bold">イベントがありません</p>
      )}

      {/* ===== カバーフロー ===== */}
      {view === 'cf' && active.length > 0 && (
        <div>
          <div className="cf-wrap">
            {active.map((ev, i) => {
              const offset = i - center;
              let posClass = 'cf-pos-hidden';
              if (offset === 0) posClass = 'cf-pos-0';
              else if (offset === -1) posClass = 'cf-pos--1';
              else if (offset === -2) posClass = 'cf-pos--2';
              else if (offset === 1) posClass = 'cf-pos-1';
              else if (offset === 2) posClass = 'cf-pos-2';
              return (
                <div key={ev.id}
                  className={`cf-card ${posClass}`}
                  onClick={() => offset === 0 ? navigate(`/e/${ev.id}`) : setCenter(i)}>
                  <EventCover ev={ev}>
                    <div className="cf-label">
                      <div className="cf-title">{ev.title}</div>
                      {ev.fixedDate && <div className="cf-sub">確定: {fmtFixed(ev.fixedDate)}</div>}
                    </div>
                  </EventCover>
                </div>
              );
            })}
          </div>

          {/* 中央カードの情報 */}
          {centerEv && (
            <div className="text-center mt-4 px-2">
              <div className="font-black" style={{ fontSize: 20, letterSpacing: '-0.8px' }}>
                {centerEv.title}
              </div>
              <div className="flex gap-1.5 justify-center mt-2 flex-wrap">
                {(centerEv.tags || []).map((t, i) => <span key={i} className="pill">{t}</span>)}
                {centerEv.fixedDate && <span className="pill pill-dark">確定 {fmtFixed(centerEv.fixedDate)}</span>}
              </div>
              <div className="flex gap-2 justify-center mt-4">
                <button onClick={() => navigate(`/e/${centerEv.id}`)}
                  className="btn-dark px-6 py-2.5 text-xs">開く →</button>
                <button onClick={() => handleCopy(centerEv)}
                  className="btn-soft px-4 py-2.5 text-xs">📋</button>
                <button onClick={() => handleArchiveToggle(centerEv)}
                  className="btn-soft px-4 py-2.5 text-xs">📦</button>
              </div>
            </div>
          )}

          {/* ドット */}
          <div className="flex justify-center gap-1.5 mt-5">
            {active.map((_, i) => (
              <div key={i} onClick={() => setCenter(i)}
                className="rounded-full cursor-pointer"
                style={{
                  height: 5,
                  width: i === center ? 18 : 5,
                  background: i === center ? '#111' : 'rgba(0,0,0,0.15)',
                  transition: 'all 0.2s',
                }} />
            ))}
          </div>
        </div>
      )}

      {/* ===== グリッド ===== */}
      {view === 'grid' && (
        <div className="grid grid-cols-2 gap-3">
          {active.map((ev) => (
            <div key={ev.id} className="glass-sm overflow-hidden cursor-pointer"
              onClick={() => navigate(`/e/${ev.id}`)}>
              <EventCover ev={ev} height={110} className="text-[42px]" />
              <div className="p-3">
                <div className="font-black text-[13px] leading-tight mb-1.5" style={{ letterSpacing: '-0.3px' }}>
                  {ev.title}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(ev.tags || []).slice(0, 2).map((t, i) => (
                    <span key={i} className="pill" style={{ fontSize: 9, padding: '2px 8px' }}>{t}</span>
                  ))}
                  {ev.fixedDate && (
                    <span className="pill pill-dark" style={{ fontSize: 9, padding: '2px 8px' }}>
                      {fmtFixed(ev.fixedDate)}
                    </span>
                  )}
                </div>
                <ParticipantChips activityId={ev.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* アーカイブ */}
      {archived.length > 0 && (
        <div className="mt-8 px-1">
          <button onClick={() => setShowArchived((v) => !v)}
            className="w-full sec-label py-3 bg-transparent border-0 cursor-pointer">
            📦 アーカイブ（{archived.length}） {showArchived ? '▲' : '▼'}
          </button>
          {showArchived && (
            <div className="grid grid-cols-2 gap-3 mt-2 animate-in">
              {archived.map((ev) => (
                <div key={ev.id} className="glass-sm overflow-hidden" style={{ opacity: 0.65 }}>
                  <EventCover ev={ev} height={80} className="text-[32px]" />
                  <div className="p-3">
                    <div className="font-black text-xs leading-tight mb-2">{ev.title}</div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleArchiveToggle(ev)}
                        className="btn-soft text-[9px] px-2.5 py-1 flex-1">↩️ 復元</button>
                      <button onClick={() => handleCopy(ev)}
                        className="btn-soft text-[9px] px-2.5 py-1 flex-1">📋 コピー</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
