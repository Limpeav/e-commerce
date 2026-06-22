import { Loader } from '../../components/Loader';
import { useDarkMode } from '../../hooks';

export default function Loading({ message = 'Loading...' }) {
  const [isDark] = useDarkMode();

  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDark ? 'bg-slate-950' : 'bg-gray-50'
      }`}
    >
      <Loader 
        size="large" 
        message={message}
        fullScreen={false}
      />
    </div>
  );
}
