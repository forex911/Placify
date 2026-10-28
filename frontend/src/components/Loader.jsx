import React from 'react';
import { Diamond } from './ui/diamond';

function Loader({ message = 'Loading...', size = 40, className = '' }) {
  return (
    <div className={`loader-container ${className}`}>
      <div className="loader-placify">
        <Diamond size={size} className="loader-diamond-svg size-10" />
      </div>
      {message && <p className="loader-message">{message}</p>}
    </div>
  );
}

export { Diamond };
export default Loader;
