// utils/availabilityUtils.js

/**
 * Converts a time string 'HH:MM' to minutes since midnight.
 * @param {String} timeStr - Time string in 'HH:MM' format.
 * @returns {Number} - Minutes since midnight.
 */
// export const timeToMinutes = (timeStr) => {
//     const [hours, minutes] = timeStr.split(':').map(Number);
//     return hours * 60 + minutes;
//   };
  
  /**
   * Checks if the slot is already taken by an appointment.
   * @param {Object} doctor - Doctor object.
   * @param {String} day - Date string in 'YYYY-MM-DD' format.
   * @param {String} slot - Time string in 'HH:MM' format.
   * @param {Array} appointments - Array of appointment objects.
   * @returns {Boolean} - True if slot is taken, else false.
   */
  export const isSlotTaken = (doctor, day, slot, appointments) => {
    // const slotMinutes = timeToMinutes(slot);
    return appointments.some(
      (app) =>
        app.doctorId === doctor.id &&
        app.date === day &&
        slot >= app.start &&
        slot < app.end &&
        (app.status === "confirmed" || app.status === "in-progress")
    );
  };
  
  /**
   * Checks if the doctor is absent on the given day.
   * @param {Object} doctor - Doctor object.
   * @param {String} day - Date string in 'YYYY-MM-DD' format.
   * @returns {Boolean} - True if absent, else false.
   */
  export const isDoctorAbsent = (doctor, day) => {
    if(!doctor.availability.absences){return false}
    // Convert 'day' to a Date object if it's a string
    const targetDay = typeof day === 'string' ? new Date(day) : day;
    // console.log("checking absences for ", doctor.availability);
    return doctor.availability.absences.some((abs) => {
      // Convert absence dates to Date objects if they are strings
      const startDate = typeof abs.startDate === 'string' ? new Date(abs.startDate) : abs.startDate;
      const endDate = typeof abs.endDate === 'string' ? new Date(abs.endDate) : abs.endDate;
      
      // Normalize the time to the start of the day for accurate comparison
      const normalizedTargetDay = new Date(targetDay);
      normalizedTargetDay.setHours(0, 0, 0, 0);
      
      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setHours(0, 0, 0, 0);
      
      const normalizedEndDate = new Date(endDate);
      normalizedEndDate.setHours(0, 0, 0, 0);
      
      // Check if the target day is within the absence period (inclusive)
      return normalizedTargetDay >= normalizedStartDate && normalizedTargetDay <= normalizedEndDate;
    });
  };
  
  /**
   * Checks if there's a one-time availability on the given day and slot.
   * @param {Object} doctor - Doctor object.
   * @param {String} day - Date string in 'YYYY-MM-DD' format.
   * @param {String} slot - Time string in 'HH:MM' format.
   * @returns {Boolean} - True if available, else false.
   */
  export const isOneTimeAvailable = (doctor, day, slot) => {

    // const slotMinutes = timeToMinutes(slot);
    const oneTimeAvailabilities = doctor.availability.one_time_availabilities.filter(
      (av) => av.date === day
    );
    if(!oneTimeAvailabilities){return false;}
    return oneTimeAvailabilities.some((av) =>
      av.timeRanges.some((tr) => 
        slot >= tr.start && slot < tr.end
      )
    );
  };
  
  /**
   * Checks if the slot falls within the recurring availability.
   * @param {Object} doctor - Doctor object.
   * @param {String} day - Date string in 'YYYY-MM-DD' format.
   * @param {String} slot - Time string in 'HH:MM' format.
   * @returns {Boolean} - True if available, else false.
   */
  export const isRecurringAvailable = (doctor, day, slot) => {
    const dayOfWeek = new Date(day).toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    
    const recurringAvailabilities = doctor.availability.recurring.filter(
        (rec) => rec.day === dayOfWeek && day >= rec.startDate && day <= rec.endDate
      );

      
    for (let rec_av of recurringAvailabilities) {
        for(let tr of rec_av.timeRanges){
            if (slot >= tr.start && slot < tr.end) {
                // console.log("Available for ", slot);
                return true;
            }
        }    
            
    }
    return false;
    
    // const slotMinutes = timeToMinutes(slot);
  
    // const recurringAvailabilities = doctor.availability.recurring.filter(
    //   (rec) => rec.day === dayOfWeek
    // );
    

    // if(recurringAvailabilities.length>0){
    //     recurringAvailabilities.forEach((tr) => console.log("chuj", tr.timeRanges));
    //     const availableForSlot = recurringAvailabilities.some((rec_av) => 
    //         slot >= rec_av.timeRanges.start && slot < rec_av.timeRanges.end
    //       );

    //       console.log("Available for ", slot, "  -  ", availableForSlot);
        
    // }

    // return false;

    
    
      
  };
  
  /**
   * Aggregates all availability checks and returns the availability status.
   * @param {Object} doctor - Doctor object.
   * @param {String} day - Date string in 'YYYY-MM-DD' format.
   * @param {String} slot - Time string in 'HH:MM' format.
   * @param {Array} appointments - Array of appointment objects.
   * @returns {Object} - Availability status.
   */
  export const getAvailabilityStatus = (doctor, day, slot, appointments) => {
    const taken = isSlotTaken(doctor, day, slot, appointments);
    const absent = isDoctorAbsent(doctor, day);
    const oneTime = isOneTimeAvailable(doctor, day, slot);
    const recurring = isRecurringAvailable(doctor, day, slot);
  
    return {
      isTaken: taken,
      isAbsent: absent,
      isOneTimeAvailable: oneTime,
      isRecurringAvailable: recurring,
    };
  };

  export const getPatientAvailability = (patient, day, slot, appointments) => {
    return appointments.filter(
        (app) =>
          app.patientId === patient &&
          app.date === day &&
          slot >= app.start &&
          slot < app.end &&
          (app.status === "confirmed" || app.status === "in-progress")
      );

  }


  
  