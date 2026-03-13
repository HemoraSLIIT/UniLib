import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getBookById, borrowBook } from '../services/api';
import { useAuth } from '../context/AuthContext';

const BookDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [borrowing, setBorrowing] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const data = await getBookById(id);
        setBook(data);
      } catch (err) {
        setError('Failed to load book details.');
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const handleBorrow = async () => {
    setMessage('');
    setError('');
    setBorrowing(true);

    try {
      await borrowBook(book._id);
      setMessage('Book borrowed successfully! Check your loans page.');
      // Refresh book data to update availability
      const updated = await getBookById(id);
      setBook(updated);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to borrow book. Please try again.'
      );
    } finally {
      setBorrowing(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading book details...</div>;
  }

  if (!book) {
    return <div className="empty-state">Book not found.</div>;
  }

  return (
    <div className="book-detail">
      <h2>{book.title}</h2>

      {message && <div className="form-success">{message}</div>}
      {error && <div className="form-error">{error}</div>}

      <div className="detail-row">
        <span className="detail-label">Author</span>
        <span className="detail-value">{book.author}</span>
      </div>

      {book.isbn && (
        <div className="detail-row">
          <span className="detail-label">ISBN</span>
          <span className="detail-value">{book.isbn}</span>
        </div>
      )}

      {book.category && (
        <div className="detail-row">
          <span className="detail-label">Category</span>
          <span className="detail-value">{book.category}</span>
        </div>
      )}

      {book.publisher && (
        <div className="detail-row">
          <span className="detail-label">Publisher</span>
          <span className="detail-value">{book.publisher}</span>
        </div>
      )}

      {book.year && (
        <div className="detail-row">
          <span className="detail-label">Year</span>
          <span className="detail-value">{book.year}</span>
        </div>
      )}

      {book.description && (
        <div className="detail-row">
          <span className="detail-label">Description</span>
          <span className="detail-value">{book.description}</span>
        </div>
      )}

      <div className="detail-row">
        <span className="detail-label">Availability</span>
        <span className="detail-value">
          <span className={book.availableCopies > 0 ? 'available' : 'unavailable'}>
            {book.availableCopies} of {book.totalCopies} copies available
          </span>
        </span>
      </div>

      <div style={{ marginTop: '24px' }}>
        {user && book.availableCopies > 0 && (
          <button
            className="btn btn-primary"
            onClick={handleBorrow}
            disabled={borrowing}
          >
            {borrowing ? 'Borrowing...' : 'Borrow This Book'}
          </button>
        )}
        {!user && (
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Please log in to borrow this book.
          </p>
        )}
        {user && book.availableCopies === 0 && (
          <p style={{ color: '#dc3545', fontSize: '0.9rem' }}>
            No copies currently available for borrowing.
          </p>
        )}
      </div>
    </div>
  );
};

export default BookDetailPage;
