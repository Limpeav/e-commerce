import React from 'react';
import { Loader } from '../Loader';

const Loading = ({ message = 'Loading...', fullScreen = false }) => {
  return (
    <Loader
      message={message}
      fullScreen={fullScreen}
      size={fullScreen ? 'large' : 'medium'}
      className={fullScreen ? '' : 'min-h-[45vh] w-full'}
    />
  );
};

export default Loading;
