import React from 'react';
import './PrimaryButton.css';

export default function PrimaryButton({ children, onClick }) {
  return (
    <button className="primary-btn" onClick={onClick}>
      {children}
    </button>
  );
}