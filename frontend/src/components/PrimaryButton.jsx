import React from 'react';
import './PrimaryButton.css';

export default function PrimaryButton({ children, onClick, type = 'button' }) {
  return (
    <button className="primary-btn" type={type} onClick={onClick}>
      {children}
    </button>
  );
}