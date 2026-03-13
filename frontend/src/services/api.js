import axios from 'axios';

const API_BASE = {
  users: process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:3001/api',
  books: process.env.REACT_APP_BOOK_SERVICE_URL || 'http://localhost:3002/api',
  loans: process.env.REACT_APP_LOAN_SERVICE_URL || 'http://localhost:3003/api',
  notifications: process.env.REACT_APP_NOTIFICATION_SERVICE_URL || 'http://localhost:3004/api',
};

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Create axios instance for a given service
const createRequest = (service) => {
  return axios.create({
    baseURL: API_BASE[service],
  });
};

// ============ User Service ============

export const login = async (email, password) => {
  const res = await createRequest('users').post('/users/login', { email, password });
  return res.data;
};

export const register = async (name, email, password, role) => {
  const res = await createRequest('users').post('/users/register', { name, email, password, role });
  return res.data;
};

export const getProfile = async () => {
  const res = await createRequest('users').get('/users/profile', {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// ============ Book Service ============

export const getBooks = async (search = '') => {
  const params = search ? { search } : {};
  const res = await createRequest('books').get('/books', {
    params,
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getBookById = async (id) => {
  const res = await createRequest('books').get(`/books/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const addBook = async (bookData) => {
  const res = await createRequest('books').post('/books', bookData, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const updateBook = async (id, bookData) => {
  const res = await createRequest('books').put(`/books/${id}`, bookData, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const deleteBook = async (id) => {
  const res = await createRequest('books').delete(`/books/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// ============ Loan Service ============

export const borrowBook = async (bookId) => {
  const res = await createRequest('loans').post('/loans/borrow', { bookId }, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const returnBook = async (loanId) => {
  const res = await createRequest('loans').post(`/loans/return/${loanId}`, {}, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getUserLoans = async () => {
  const res = await createRequest('loans').get('/loans/my-loans', {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// ============ Notification Service ============

export const getUserNotifications = async () => {
  const res = await createRequest('notifications').get('/notifications', {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const markAsRead = async (notificationId) => {
  const res = await createRequest('notifications').put(`/notifications/${notificationId}/read`, {}, {
    headers: getAuthHeaders(),
  });
  return res.data;
};
