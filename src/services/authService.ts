import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { CustomUser } from '@/types/user';

export interface AuthService {
  login: (email: string, password: string) => Promise<CustomUser>;
  signup: (email: string, password: string) => Promise<CustomUser>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<CustomUser | null>;
  onAuthStateChange: (callback: (user: CustomUser | null) => void) => () => void;
}

class FirebaseAuthService implements AuthService {
  async login(email: string, password: string): Promise<CustomUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      console.log("User UID from Firestore Service:", uid);
      
      // Store UID in localStorage
      localStorage.setItem('userUid', uid);
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('User data not found');
      }

      const userData = querySnapshot.docs[0].data();
      console.log("User data from Firestore Service:", userData);
      return {
        uid,
        role: userData.role
      } as CustomUser;
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password');
      } else if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Invalid password');
      }
      throw error;
    }
  }

  async signup(email: string, password: string): Promise<CustomUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', uid), {
        email,
        role: 'user',
        createdAt: Timestamp.now()
      });

      return {
        ...userCredential.user,
        role: 'user'
      } as CustomUser;
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email is already registered');
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      // Remove UID from localStorage
      localStorage.removeItem('userUid');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<CustomUser | null> {
    const user = auth.currentUser;
    if (!user) return null;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return null;

    const userData = userDoc.data();
    return {
      ...user,
      role: userData.role
    } as CustomUser;
  }

  onAuthStateChange(callback: (user: CustomUser | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        callback(null);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        callback(null);
        return;
      }

      const userData = userDoc.data();
      callback({
        ...firebaseUser,
        role: userData.role
      } as CustomUser);
    });
  }
}

export const authService = new FirebaseAuthService(); 