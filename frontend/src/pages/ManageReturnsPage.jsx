import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getActiveLoans, returnBook, getUserById } from '../services/api.js';

function ManageReturnsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [studentNames, setStudentNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const canManage = user?.role === 'staff' || user?.role === 'admin';

  useEffect(() => {
    if (!user || !canManage) {
      navigate('/');
      return;
    }

    fetchActiveLoans();
  }, [user, navigate]);

  const fetchActiveLoans = async () => {
    setLoading(true);
    try {
      const data = await getActiveLoans();
      const loansArr = Array.isArray(data) ? data : [];
      setLoans(loansArr);

      // Fetch student names for all unique userIds
      const uniqueUserIds = [...new Set(loansArr.map((l) => l.userId))];
      const names = {};
      await Promise.all(
        uniqueUserIds.map(async (id) => {
          try {
            const userData = await getUserById(id);
            names[id] = userData.name || userData.email || id;
          } catch {
            names[id] = id;
          }
        })
      );
      setStudentNames(names);
    } catch (err) {
      console.error('Failed to fetch active loans:', err);
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
      setMessage('Book return processed successfully! Student has been notified.');
      await fetchActiveLoans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process return.');
    }
  };

  const formatDate = (dateStr) => (dateStr ? new Date(dateStr).toLocaleDateString() : '-');

  const statusClass = (status) => {
    if (status === 'overdue') return 'bg-[#fff1eb] text-[#9a3412]';
    return 'bg-[#e8eef5] text-[#163b63]';
  };

  const isOverdue = (loan) => loan.status === 'overdue' || new Date(loan.dueDate) < new Date();

  if (loading) {
    return (
      <div className="surface-card-soft p-10 text-center text-[#5f6f81]">
        Loading active loans...
      </div>
    );
  }

  return (
    <section className="page-shell">
      <div>
        <p className="page-eyebrow">Staff Panel</p>
        <h1 className="title-serif mt-3 text-4xl font-semibold text-[#203245]">Manage Returns</h1>
        <p className="mt-3 max-w-2xl text-[#6b7280]">
          Process book returns for students. A notification will be sent to the student upon return.
        </p>
      </div>

      {message && (
        <div className="notice-success">
          {message}
        </div>
      )}

      {error && (
        <div className="notice-error">
          {error}
        </div>
      )}

      {loans.length === 0 ? (
        <div className="surface-card-soft border-dashed p-10 text-center text-[#5f6f81]">
          No active loans to process.
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#ece8e0]">
              <thead className="bg-[#f8fafc] text-left text-sm uppercase tracking-[0.15em] text-[#6b7280]">
                <tr>
                  <th className="px-6 py-4">Book Title</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Borrow Date</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece8e0] text-sm text-[#203245]">
                {loans.map((loan) => (
                  <tr key={loan._id} className={isOverdue(loan) ? 'bg-red-50/50' : ''}>
                    <td className="px-6 py-4 font-medium">{loan.bookTitle || 'Unknown'}</td>
                    <td className="px-6 py-4">{studentNames[loan.userId] || loan.userId}</td>
                    <td className="px-6 py-4">{formatDate(loan.borrowDate)}</td>
                    <td className="px-6 py-4">{formatDate(loan.dueDate)}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase ${statusClass(loan.status)}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleReturn(loan._id)}
                        className="button-primary rounded-md px-4 py-2 text-sm"
                      >
                        Process Return
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default ManageReturnsPage;
