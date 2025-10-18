import React, { useState, useRef, useEffect } from 'react';

interface HamburgerMenuProps {
  onTutorialClick: () => void;
  onLessonsClick: () => void;
  onSettingsClick: () => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ 
  onTutorialClick, 
  onLessonsClick, 
  onSettingsClick 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMenuToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuClick = (callback: () => void) => {
    callback();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Hamburger Button */}
      <button
        onClick={handleMenuToggle}
        className="p-2 hover:bg-white/50 rounded-lg transition-colors relative z-10"
        title="Menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <span
            className={`block w-5 h-0.5 bg-stone-700 transition-all duration-300 ${
              isOpen ? 'rotate-45 translate-y-1.5' : ''
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-stone-700 transition-all duration-300 my-1 ${
              isOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-stone-700 transition-all duration-300 ${
              isOpen ? '-rotate-45 -translate-y-1.5' : ''
            }`}
          />
        </div>
      </button>

      {/* Menu Dropdown */}
      <div
        className={`absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-amber-200 overflow-hidden transition-all duration-300 z-50 ${
          isOpen 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
        }`}
      >
        {/* Menu Header */}
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 border-b border-amber-200">
          <h3 className="text-lg font-bold text-stone-800 font-script">Menu</h3>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          <button
            onClick={() => handleMenuClick(onTutorialClick)}
            className="w-full flex items-center px-4 py-3 text-left hover:bg-amber-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-stone-800 font-serif">Tutorial Guide</div>
              <div className="text-sm text-stone-600 font-serif">Learn how to use the app</div>
            </div>
          </button>

          <button
            onClick={() => handleMenuClick(onLessonsClick)}
            className="w-full flex items-center px-4 py-3 text-left hover:bg-amber-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-stone-800 font-serif">Lessons Summary</div>
              <div className="text-sm text-stone-600 font-serif">View all collected lessons</div>
            </div>
          </button>

          <button
            onClick={() => handleMenuClick(onSettingsClick)}
            className="w-full flex items-center px-4 py-3 text-left hover:bg-amber-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-stone-200 transition-colors">
              <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-stone-800 font-serif">Settings</div>
              <div className="text-sm text-stone-600 font-serif">Customize your experience</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HamburgerMenu;
