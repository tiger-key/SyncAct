import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LogoLockup } from './components/Logo';
import GroupPage from './pages/GroupPage';
import EventPage from './pages/EventPage';
import CreatePage from './pages/CreatePage';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  // GroupPageは独自ヘッダーを持つのでロゴを非表示
  const isGroupTop = /^\/g\/[^/]+$/.test(location.pathname);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-md mx-auto">
        {!isGroupTop && (
          <header className="flex justify-center pt-2 mb-6">
            <div className="cursor-pointer" onClick={() => navigate(-1)}>
              <LogoLockup iconSize={28} showTagline />
            </div>
          </header>
        )}
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
