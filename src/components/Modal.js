// components/common/Modal.js
import React from 'react';
import PropTypes from 'prop-types';
import '../styles/modal.css'; // Ensure correct path

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  // Close modal when clicking outside the content
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close modal on Escape key press
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex="-1" // Make div focusable for key events
      aria-modal="true"
      role="dialog"
    >
      <div className="modal-content">
        <button className="modal-close-button" onClick={onClose} aria-label="Close Modal">
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,      // Controls modal visibility
  onClose: PropTypes.func.isRequired,     // Function to close modal
  children: PropTypes.node.isRequired,    // Modal content
};

export default Modal;
