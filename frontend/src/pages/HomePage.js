import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBooks } from '../services/api';

const HomePage = () => {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchBooks = async (query = '') => {
    setLoading(true);
    try {
      const data = await getBooks(query);
      // Handle both array response and { books: [...] } response
      setBooks(Array.isArray(data) ? data : data.books || []);
    } catch (err) {
      console.error('Failed to fetch books:', err);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks(search);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Book Catalog</h2>
      </div>

      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          placeholder="Search books by title, author, or ISBN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      {loading ? (
        <div className="loading">Loading books...</div>
      ) : books.length === 0 ? (
        <div className="empty-state">No books found.</div>
      ) : (
        <div className="book-grid">
          {books.map((book) => (
            <div
              key={book._id}
              className="book-card"
              onClick={() => navigate(`/books/${book._id}`)}
            >
              <h3>{book.title}</h3>
              <p>by {book.author}</p>
              {book.category && <p>Category: {book.category}</p>}
              {book.isbn && <p>ISBN: {book.isbn}</p>}
              <div className="availability">
                <span className={book.availableCopies > 0 ? 'available' : 'unavailable'}>
                  {book.availableCopies > 0
                    ? `${book.availableCopies} of ${book.totalCopies} available`
                    : 'No copies available'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
