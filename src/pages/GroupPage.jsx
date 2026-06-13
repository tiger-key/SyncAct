import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  listenGroupEvents, listenResponses, updateEventMemo,
  setEventStatus, copyEvent, getGroup, setGroupName,
} from '../lib/db';
import MemoCard from '../components/MemoCard';
import { formatDateJa } from '../lib/utils';

// イベントカード内の参加者バッジ（リアルタイム）
function ParticipantBadges({ activityId }) {
  const [responses, setResponses] = useState([]);
  useEffect(() => listenResponses(activityId, setResponses), [activityId]);
  if (!responses.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-4">
      {responses.map((r) => {
        const isBatsu = r.status === 'unavailable';
        const style = isBatsu
          ? 'bg-rose-50 text-rose-400 border-rose-100 opacity-70'
          : 'bg-blue-50 text-blue-600 border-blue-100';
        return (
          <span key={r.id} className={`px-2.5 py-1 rounded-full border text-[9px] font-black tracking-tight ${style}`}>
            {r.name}
          </span>
        );
      })}
    </div>
  );
}

function EventCard({ ev, onArchiveToggle, onCopy }) {
  const navigate = useNavigate();
  const archived = ev.status === 'archived';
  return (
    <div className={`bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 mb-2 ${archived ? 'opacity-70' : ''}`}>
      <div
        className="cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => navigate(`/e/${ev.id}`)}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap gap-1">
            {(ev.tags || []).map((t, i) => (
              <span key={i} className="px-2 py-0.5 text-[9px] bg-blue-100 text-blue-600 rounded font-black uppercase">{t}</span>
            ))}
          </div>
          {ev.fixedDate && (
            <span className="px-3 py-1 text-[10px] bg-rose-500 text-white rounded-full font-black shadow-sm shrink-0">
              確定: {formatDateJa(ev.fixedDate)}
            </span>
          )}
        </div>
        <h3 className="text-xl font-black text-gray-800 leading-tight">{ev.title}</h3>
        {!archived && <ParticipantBadges activityId={ev.id} />}
      </div>

      {!archived && (
        <MemoCard compact memo={ev.memo} onSave={(m) => updateEventMemo(ev.id, m)} />
      )}

      <div className="flex gap-2 mt-4 pt-3 border-t border-dashed border-gray-100">
        <button
          onClick={() => onArchiveToggle(ev)}
          className="flex-1 text-[10px] font-black text-gray-400 bg-gray-50 py-2 rounded-xl active:scale-95 transition-transform"
        >
          {archived ? '↩️ 復元' : '📦 アーカイブ'}
        </button>
        <button
          onClick={() => onCopy(ev)}
          className="flex-1 text-[10px] font-black text-blue-500 bg-blue-50 py-2 rounded-xl active:scale-95 transition-transform"
        >
          📋 コピーして新規作成
        </button>
      </div>
    </div>
  );
}

export default function GroupPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState(null);
  const [groupName, setGroup] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const unsub = listenGroupEvents(groupId, setEvents);
    getGroup(groupId).then((g) => g?.name && setGroup(g.name));
    return unsub;
  }, [groupId]);

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

  const active = (events || []).filter((e) => e.status !== 'archived');
  const archived = (events || []).filter((e) => e.status === 'archived');

  return (
    <div className="space-y-6 animate-in">
      <div className="text-center -mt-4 mb-2">
        <span onClick={editGroupName} className="text-2xl font-bold text-gray-800 tracking-tight cursor-pointer">
          {groupName || 'SyncAct'}
        </span>
        <span className="text-sm font-bold text-gray-400 ml-1">一覧</span>
      </div>

      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-black text-gray-900">イベント一覧</h2>
        <button
          onClick={() => navigate(`/g/${groupId}/new`)}
          className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-black shadow-lg hover:bg-blue-700 transition-all active:scale-90"
        >
          ＋ 新規作成
        </button>
      </div>

      <div className="grid gap-4">
        {events === null && (
          <p className="text-center py-8 text-gray-300 text-sm font-bold">読み込み中...</p>
        )}
        {events !== null && !active.length && (
          <p className="text-center py-8 text-gray-300 text-sm font-bold">イベントがありません</p>
        )}
        {active.map((ev) => (
          <EventCard key={ev.id} ev={ev} onArchiveToggle={handleArchiveToggle} onCopy={handleCopy} />
        ))}
      </div>

      {archived.length > 0 && (
        <div className="px-2">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="w-full text-[11px] font-black text-gray-400 py-3 uppercase tracking-widest"
          >
            📦 アーカイブ（{archived.length}） {showArchived ? '▲' : '▼'}
          </button>
          {showArchived && (
            <div className="grid gap-4 mt-2 animate-in">
              {archived.map((ev) => (
                <EventCard key={ev.id} ev={ev} onArchiveToggle={handleArchiveToggle} onCopy={handleCopy} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
