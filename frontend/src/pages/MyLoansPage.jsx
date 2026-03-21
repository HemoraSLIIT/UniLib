import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getUserLoans } from '../services/api.js';

function MyLoansPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const formatDate = (dateStr) => (dateStr ? new Date(dateStr).toLocaleDateString() : '-');

  const statusClass = (status) => {
    if (status === 'returned') return 'bg-[#f1f5f9] text-[#475569]';
    if (status === 'overdue') return 'bg-[#fff1eb] text-[#9a3412]';
    return 'bg-[#e8eef5] text-[#163b63]';
  };

  if (loading) {
    return (
      <div className="surface-card-soft p-10 text-center text-[#5f6f81]">
        Loading your loans...
      </div>
    );
  }

  return (
    <section className="page-shell">
      <div>
        <p className="page-eyebrow">Loan history</p>
        <h1 className="title-serif mt-3 text-4xl font-semibold text-[#203245]">My Loans</h1>
        <p className="mt-3 max-w-2xl text-[#6b7280]">
          Review your active loans and check due dates.
        </p>
      </div>

      {loans.length === 0 ? (
        <div className="surface-card-soft border-dashed p-10 text-center text-[#5f6f81]">
          You have no loans yet.
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#ece8e0]">
              <thead className="bg-[#f8fafc] text-left text-sm uppercase tracking-[0.15em] text-[#6b7280]">
                <tr>
                  <th className="px-6 py-4">Book Title</th>
                  <th className="px-6 py-4">Borrow Date</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece8e0] text-sm text-[#203245]">
                {loans.map((loan) => (
                  <tr key={loan._id}>
                    <td className="px-6 py-4">{loan.bookTitle || loan.book?.title || 'Unknown'}</td>
                    <td className="px-6 py-4">{formatDate(loan.borrowDate)}</td>
                    <td className="px-6 py-4">{formatDate(loan.dueDate)}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase ${statusClass(loan.status)}`}>
                        {loan.status}
                      </span>
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

export default MyLoansPage;
