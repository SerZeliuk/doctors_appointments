// Create half-hour slots from a start hour for a given number of hours
export function halfHourSlots(startHour, numHours) {
    const slots = [];
    for (let h = startHour; h < startHour + numHours; h++) {
      slots.push(`${h}:00`);
      slots.push(`${h}:30`);
    }
    return slots;
  }
  