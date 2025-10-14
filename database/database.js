import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

//connecter til firebase database
const firebaseConfig = {
  apiKey: "AIzaSyCdbKvohgVgikFh3_vgqUQ-zrXDXE4fQT0",
  authDomain: "inno-e0b9f.firebaseapp.com",
  projectId: "inno-e0b9f",
  storageBucket: "inno-e0b9f.firebasestorage.app",
  messagingSenderId: "342720399549",
  appId: "1:342720399549:web:8484fa7f5e3ec0e2284fd4"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { auth };