import React from 'react';
import './TextField.css';

export default function TextField({ label, error, className = '', ...props }) {
  return (
    <label className={`text-field ${className}`.trim()}>
      <span className="text-field__label">{label}</span>
      <input className={`text-field__input ${error ? 'text-field__input--error' : ''}`} {...props} />
      {error ? <span className="text-field__error">{error}</span> : null}
    </label>
  );
}