import React, { useState } from 'react';
import './Header.css';

const Header = ({ cartItems, onCartOpen, cartUpdated }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <header className="site-header">
        <div className="header-container">
          {/* Левая часть - Логотип и меню */}
          <div className="header-left">
            <button 
              className="hamburger-menu"
              onClick={toggleMenu}
              aria-label="Открыть меню"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <div className="header-logo">
              <span className="logo-text">MATRACE NATURA</span>
            </div>
          </div>

          {/* Центральная навигация (только десктоп) */}
          <nav className="header-nav desktop-nav">
            <a href="/o-nas" className="nav-link">О нас</a>
            <a href="/katalog" className="nav-link">Каталог</a>
            <a href="/kontakt" className="nav-link">Контакты</a>
          </nav>

          {/* Правая часть - Корзина */}
          <div className="header-right">
            <button 
              className={`cart-button ${cartUpdated ? 'animate-pulse' : ''}`}
              onClick={onCartOpen}
              aria-label="Открыть корзину"
            >
              🛒 
              {cartItems.length > 0 && (
                <span className={`cart-badge ${cartUpdated ? 'animate-bounce' : ''}`}>
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div className="mobile-nav-overlay" onClick={toggleMenu}>
          <div className="mobile-nav-content" onClick={e => e.stopPropagation()}>
            <button className="close-menu" onClick={toggleMenu} aria-label="Закрыть меню">
              ×
            </button>
            <nav className="mobile-nav">
              <a href="/o-nas" className="mobile-nav-link" onClick={toggleMenu}>О нас</a>
              <a href="/katalog" className="mobile-nav-link" onClick={toggleMenu}>Каталог</a>
              <a href="/kontakt" className="mobile-nav-link" onClick={toggleMenu}>Контакты</a>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;