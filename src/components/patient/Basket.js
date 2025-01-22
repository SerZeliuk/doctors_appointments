// src/components/patient/Basket.js
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import '../../styles/basket.css'; // Ensure correct path

const Basket = ({ basket, removeFromBasket, handleCheckout }) => {
  const [timeLeft, setTimeLeft] = useState({});

  /**
   * Keeps countdown timers for each item in the basket.
   * If time runs out, automatically remove the item.
   */
  useEffect(() => {
    const updateTimers = () => {
      const newTimeLeft = {};
      const currentTime = Date.now();

      basket.forEach((item) => {
        // We set totalSeconds = 60 for a 1-minute timer in this example.
        // Adjust to 600 for a 10-minute timer, etc.
        const elapsedSeconds = Math.floor((currentTime - item.addedAt) / 1000);
        const totalSeconds = 60; // 1 minute for demonstration
        const remainingSeconds = totalSeconds - elapsedSeconds;

        if (remainingSeconds <= 0) {
          newTimeLeft[item.id] = '00:00';
          // Correctly pass both basketItemId and appointmentId
          removeFromBasket(item.id, item.appointmentId);
        } else {
          const minutes = Math.floor(remainingSeconds / 60);
          const seconds = remainingSeconds % 60;
          const formattedMins = minutes.toString().padStart(2, '0');
          const formattedSecs = seconds.toString().padStart(2, '0');
          newTimeLeft[item.id] = `${formattedMins}:${formattedSecs}`;
        }
      });

      setTimeLeft(newTimeLeft);
    };

    updateTimers(); // Initial call
    const intervalId = setInterval(updateTimers, 1000);

    return () => clearInterval(intervalId);
  }, [basket, removeFromBasket]);

  return (
    <div className="basket">
      <h3>Your Basket</h3>
      <ul className="basket-list">
        {basket.map((item) => (
          <li key={item.id} className="basket-item">
            <div className="basket-details">
              <span>
                <strong>Doctor:</strong> {item.doctorName}
              </span>
              <span>
                <strong>Patient:</strong> {item.patientName}
              </span>
              <span>
                <strong>Date:</strong> {item.date}
              </span>
              <span>
                <strong>Time:</strong> {item.start} - {item.end}
              </span>
              <span>
                <strong>Status:</strong> {item.status}
              </span>
              {/* Uncomment if needed
              <span>
                <strong>Description:</strong> {item.description}
              </span>
              */}
              <span>
                <strong>Expires In:</strong> {timeLeft[item.id] || '...'}
              </span>
            </div>

            <button
              type="button"
              className="remove-button"
              onClick={() => removeFromBasket(item.id, item.appointmentId)} // Pass both IDs
              title="Remove from Basket"
            >
              &times;
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={handleCheckout}
        className="checkout-button"
        disabled={basket.length === 0}
      >
        Checkout
      </button>
    </div>
  );
};

Basket.propTypes = {
  /**
   * The basket is an array of local items. Each item references the actual
   * Appointment's _id in `appointmentId`. The other fields (doctorName, etc.)
   * are filled in via mapping in the parent component.
   */
  basket: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,               // local basket item UUID
      appointmentId: PropTypes.string.isRequired,   // The appointment's _id in Mongo
      doctorName: PropTypes.string,
      patientName: PropTypes.string,
      date: PropTypes.string,
      start: PropTypes.string,
      end: PropTypes.string,
      status: PropTypes.string,
      description: PropTypes.string,
      addedAt: PropTypes.number.isRequired,          // timestamp when item was added
    })
  ).isRequired,
  removeFromBasket: PropTypes.func.isRequired,
  handleCheckout: PropTypes.func.isRequired,
};

export default Basket;
