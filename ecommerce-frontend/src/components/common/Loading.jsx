import React from 'react';
import { Loader } from '../Loader';

const Loading = ({ message = 'Loading...' }) => {
  return <Loader message={message} fullScreen={true} size="large" />;
};

export default Loading;
