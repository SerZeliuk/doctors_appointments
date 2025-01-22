import React from "react";
import TimeSlot from "./TimeSlot";

const DayColumn = ({ date }) => {
  return (
    <div className="day-column">
      <header>
        <h3>{date.toLocaleDateString()}</h3>
        <p>{date.toLocaleString("en-US", { weekday: "long" })}</p>
      </header>
      <div className="time-slots">
        {Array.from({ length: 24 }, (_, i) => (
          <TimeSlot key={i} time={`${i}:01`} />
          
        ))}
      </div>
    </div>
  );
};

export default DayColumn;
