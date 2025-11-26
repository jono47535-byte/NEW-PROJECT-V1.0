
import { UserData, AccessStatus, AppSettings } from '../types';

const USERS_KEY = 'hack_users_db';
const SETTINGS_KEY = 'hack_settings_db';

const DEFAULT_SETTINGS: AppSettings = {
  gameUrl: 'https://dkwin9.com/#/register?invitationCode=565341307515',
  appName: 'BOSS MURAD VIP',
  adminPassword: 'ADMIN123'
};

// Helper to get all users
export const getAllUsers = (): UserData[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

// Helper to save users
const saveUsers = (users: UserData[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Register or Update a device
export const registerDevice = (deviceId: string) => {
  const users = getAllUsers();
  const existing = users.find(u => u.deviceId === deviceId);
  
  if (!existing) {
    users.push({
      deviceId,
      status: AccessStatus.LOCKED,
      requestTime: Date.now()
    });
    saveUsers(users);
  }
};

// Request Access
export const requestAccess = (deviceId: string) => {
  const users = getAllUsers();
  const userIndex = users.findIndex(u => u.deviceId === deviceId);
  
  if (userIndex !== -1) {
    users[userIndex].status = AccessStatus.PENDING;
    users[userIndex].requestTime = Date.now();
    saveUsers(users);
  }
};

// Get specific user status
export const getUserStatus = (deviceId: string): UserData | undefined => {
  const users = getAllUsers();
  return users.find(u => u.deviceId === deviceId);
};

// ADMIN: Approve User
export const approveUser = (deviceId: string): string => {
  const users = getAllUsers();
  const userIndex = users.findIndex(u => u.deviceId === deviceId);
  const code = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4 digit code

  if (userIndex !== -1) {
    users[userIndex].status = AccessStatus.GRANTED;
    users[userIndex].activationCode = code;
    saveUsers(users);
    return code;
  }
  return '';
};

// ADMIN: Block/Reject User
export const changeUserStatus = (deviceId: string, status: AccessStatus) => {
  const users = getAllUsers();
  const userIndex = users.findIndex(u => u.deviceId === deviceId);
  
  if (userIndex !== -1) {
    users[userIndex].status = status;
    saveUsers(users);
  }
};

// SETTINGS
export const getSettings = (): AppSettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  if (data) {
    // Merge with defaults in case new fields are added
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  }
  return DEFAULT_SETTINGS;
};

export const updateSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};
