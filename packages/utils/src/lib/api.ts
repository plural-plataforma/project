import axios from 'axios';

const API_URL =
  typeof process !== 'undefined' && process.env.VITE_API_URL
    ? process.env.VITE_API_URL
    : 'http://10.0.2.2:5191/api';

export async function login(email: string, password: string) {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password,
  });
  return response.data.token;
}
