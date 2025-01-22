// src/components/admin/PersistenceSelector.js
import React, { useState } from 'react';
import { auth } from '../../firebase/config'; // Ensure correct import path
import {
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  browserNoPersistence,
  inMemoryPersistence,
} from 'firebase/auth';

const PersistenceSelector = () => {
  const [selectedPersistence, setSelectedPersistence] = useState('LOCAL');

  const handlePersistenceChange = async (e) => {
    const persistence = e.target.value;
    setSelectedPersistence(persistence);

    let firebasePersistence;

    switch (persistence) {
      case 'LOCAL':
        firebasePersistence = browserLocalPersistence;
        break;
      case 'SESSION':
        firebasePersistence = browserSessionPersistence;
        break;
      case 'NONE':
        firebasePersistence = inMemoryPersistence;
        break;
      default:
        firebasePersistence = browserLocalPersistence;
    }

    try {
      await setPersistence(auth, firebasePersistence);
      alert(`Persistence set to ${persistence}`);
    } catch (error) {
      console.error('Error setting persistence:', error);
      alert('Failed to set persistence.');
    }
  };

  return (
    <div className="persistence-selector">
      <h3>Set Session Persistence</h3>
      <select value={selectedPersistence} onChange={handlePersistenceChange}>
        <option value="LOCAL">Local (Remembers me)</option>
        <option value="SESSION">Session (Current tab only)</option>
        <option value="NONE">None (Do not remember)</option>
      </select>
    </div>
  );
};

export default PersistenceSelector;
