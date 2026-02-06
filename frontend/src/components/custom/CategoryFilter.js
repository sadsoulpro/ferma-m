import { useRef, useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 150;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative flex justify-center">
      {/* Left Arrow */}
      <button
        onClick={() => scroll('left')}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center transition-opacity md:hidden ${
          showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Прокрутить влево"
      >
        <ChevronLeft className="w-4 h-4 text-primary" />
      </button>

      {/* Left Fade */}
      <div 
        className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-[5] pointer-events-none transition-opacity md:hidden ${
          showLeftArrow ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Categories Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-2 overflow-x-auto pb-2 px-8 md:px-0 scrollbar-hide scroll-smooth max-w-full"
      >
        {/* "All" button */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`category-btn whitespace-nowrap px-5 py-2.5 rounded-full font-black text-sm transition-all flex-shrink-0 ${
            selectedCategory === null
              ? "bg-primary text-white active shadow-md"
              : "bg-white text-foreground border border-border hover:border-primary"
          }`}
          data-testid="category-all"
        >
          Все
        </button>

        {/* Category buttons */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`category-btn whitespace-nowrap px-5 py-2.5 rounded-full font-black text-sm transition-all flex-shrink-0 ${
              selectedCategory === category.id
                ? "bg-primary text-white active shadow-md"
                : "bg-white text-foreground border border-border hover:border-primary"
            }`}
            data-testid={`category-${category.slug}`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Right Fade */}
      <div 
        className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-[5] pointer-events-none transition-opacity md:hidden ${
          showRightArrow ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Right Arrow */}
      <button
        onClick={() => scroll('right')}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center transition-opacity md:hidden ${
          showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Прокрутить вправо"
      >
        <ChevronRight className="w-4 h-4 text-primary" />
      </button>
    </div>
  );
};

export default CategoryFilter;
