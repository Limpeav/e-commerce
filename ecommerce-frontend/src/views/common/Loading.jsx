import { Loader } from '../../components/Loader';

export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader 
        size="large" 
        message={message}
        fullScreen={false}
      />
    </div>
  );
}
