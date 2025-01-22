// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, database } from '../../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut} from 'firebase/auth';
import { getData, setData} from '../../firebase/firebaseUtils';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  


  // Fetch user role from the database
  const fetchUserRole = async (user) => {
    try {
      console.log('Fetching user role for ...', user.email);
      let role = null;
      const status = await getData(`users/`);
      for(let us in status){
        if(status[us].email == user.email){
          role = status[us].role;
          break;
        }
      }
      console.log('User role:', role);  
      return role;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        const role = await fetchUserRole(user);
        setUserRole(role);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    login: (email, password) => signInWithEmailAndPassword(auth, email, password).then(() => console.log('Logged in!')).catch((error) => { throw error; }),
    signup: (email, password, name, age) =>
      createUserWithEmailAndPassword(auth, email, password).then(async (cred) => {
        console.log('Signed up!');
              // Set doctor details in the database
            const newPatient = {
                
                email: email,
                name: name,
                age: age,
                
              };
            await setData(`patients/`, newPatient);
            await setData('users/', { email, role: 'patient' });

            return "cool";

      }).catch((error) => {
        throw error; }),
    logout: () => signOut(auth).then(() => console.log('Logged out!')).catch((error) => { throw error; }),
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
