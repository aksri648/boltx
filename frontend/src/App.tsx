import { Routes, Route } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ToastContainer } from 'react-toastify';
import IndexPage from './routes/IndexPage';
import ChatPage from './routes/ChatPage';
import GitPage from './routes/GitPage';
import PreviewPage from './routes/PreviewPage';
import { themeStore } from '~/lib/stores/theme';
import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { cssTransition } from 'react-toastify';

const toastAnimation = cssTransition({
  enter: 'animated fadeInRight',
  exit: 'animated fadeOutRight',
});

export default function App() {
  const theme = useStore(themeStore);

  useEffect(() => {
    document.querySelector('html')?.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <DndProvider backend={HTML5Backend}>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/chat/:id" element={<ChatPage />} />
        <Route path="/git" element={<GitPage />} />
        <Route path="/api/preview/:id" element={<PreviewPage />} />
      </Routes>
      <ToastContainer
        closeButton={({ closeToast }) => {
          return (
            <button className="Toastify__close-button" onClick={closeToast}>
              <div className="i-ph:x text-lg" />
            </button>
          );
        }}
        icon={({ type }) => {
          switch (type) {
            case 'success': {
              return <div className="i-ph:check-bold text-bolt-elements-icon-success text-2xl" />;
            }
            case 'error': {
              return <div className="i-ph:warning-circle-bold text-bolt-elements-icon-error text-2xl" />;
            }
          }
          return undefined;
        }}
        position="bottom-right"
        pauseOnFocusLoss
        transition={toastAnimation}
        autoClose={3000}
      />
    </DndProvider>
  );
}
