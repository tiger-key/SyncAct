import { Routes, Route, useNavigate } from 'react-router-dom';
import GroupPage from './pages/GroupPage';
import EventPage from './pages/EventPage';
import CreatePage from './pages/CreatePage';

export default function App() {
  const navigate = useNavigate();
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <header className="text-center pt-4 mb-8">
          <h1
            className="text-2xl font-black italic text-blue-300 tracking-tighter cursor-pointer opacity-80"
            onClick={() => navigate('/')}
          >
            SyncAct
          </h1>
        </header>
        <Routes>
          <Route path="/" element={<CreatePage />} />
          <Route path="/g/:groupId" element={<GroupPage />} />
          <Route path="/g/:groupId/new" element={<CreatePage />} />
          <Route path="/e/:activityId" element={<EventPage />} />
        </Routes>
      </div>
    </div>
  );
}
