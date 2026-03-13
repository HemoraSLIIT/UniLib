import React, { useState, useEffect } from 'react';
import { getUserLoans, returnBook } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MyLoansPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchLoans();
  }, [user, navigate]);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const data = await getUserLoans();
      setLoans(Array.isArray(data) ? data : data.loans || []);
    } catch (err) {
      console.error('Failed to fetch loans:', err);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (loanId) => {
    setMessage('');
    setError('');

    try {
      await returnBook(loanId);
      setMessage('Book returned successfully!');
      fetchLoans(); // Refresh the list
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to return book. Please try again.'
      );
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'returned': return 'status-returned';
      case 'overdue': return 'status-overdue';
      default: return 'status-borrowed';
    }
  };

  if (loading) {
    return <div className="loading">Loading your loans...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>My Loans</h2>
      </div>

      {message && <div className="form-success">{message}</div>}
      {error && <div className="form-error">{error}</div>}

      {loans.length === 0 ? (
        <div className="empty-state">You have no loans yet.</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Borrow Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan._id}>
                  <td>{loan.bookTitle || loan.book?.title || 'Unknown'}</td>
                  <td>{formatDate(loan.borrowDate)}</td>
                  <td>{formatDate(loan.dueDate)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(loan.status)}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td>
                    {loan.status === 'borrowed' || loan.status === 'overdue' ? (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleReturn(loan._id)}
                      >
                        Return
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyLoansPage;
