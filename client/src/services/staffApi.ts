import axios from 'axios';

const API_BASE_URL = '/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Staff login
export const staffLogin = async (email: string, password: string) => {
  const response = await axios.post(`${API_BASE_URL}/auth/staff/login`, {
    email,
    password
  });
  return response.data;
};

// Get staff tickets
export const getStaffTickets = async () => {
  const response = await axios.get(`${API_BASE_URL}/staff/tickets`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Get staff ticket detail
export const getStaffTicketDetail = async (ticketId: number) => {
  const response = await axios.get(`${API_BASE_URL}/staff/tickets/${ticketId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Reply to ticket
export const replyToTicket = async (ticketId: number, message: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/staff/tickets/${ticketId}/reply`,
    { message },
    { headers: getAuthHeader() }
  );
  return response.data;
};

// Update ticket status
export const updateTicketStatus = async (ticketId: number, status: string) => {
  const response = await axios.put(
    `${API_BASE_URL}/staff/tickets/${ticketId}/status`,
    { status },
    { headers: getAuthHeader() }
  );
  return response.data;
};

// Get staff dashboard stats
export const getStaffDashboardStats = async () => {
  const response = await axios.get(`${API_BASE_URL}/staff/tickets/dashboard/stats`, {
    headers: getAuthHeader()
  });
  return response.data;
};
