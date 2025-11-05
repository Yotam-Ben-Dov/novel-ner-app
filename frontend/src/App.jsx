import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectList from './components/ProjectList';
import ChapterEditor from './components/ChapterEditor';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div style={{ padding: '20px' }}>
          <h1>📚 Novel NER Workbench</h1>
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/project/:projectId" element={<ChapterEditor />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;