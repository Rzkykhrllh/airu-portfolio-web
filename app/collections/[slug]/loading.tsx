// Shown the moment a collection is opened, while the (force-dynamic) page
// loads: the page's shape in grey bars instead of a blank screen. Mirrors
// CollectionView's header + MasonryGrid's default columns (2 / 3 / 3).
const HEIGHTS = [
  [62, 40, 55],
  [44, 66, 38],
  [58, 46, 60],
];

export default function CollectionLoading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 skeleton" role="status" aria-label="Loading collection">
      <header className="pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="skeleton-bar h-2 w-24" />
        <div className="mt-8 skeleton-bar h-12 sm:h-14 lg:h-[4.5rem] w-2/3 max-w-xl" />
        <div className="mt-6 skeleton-bar h-2 w-40" />
      </header>
      <div className="pb-6 md:pb-8 flex justify-end">
        <div className="skeleton-bar h-2 w-20" />
      </div>
      <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
        {HEIGHTS.map((col, i) => (
          <div
            key={i}
            className={`flex-1 min-w-0 flex flex-col gap-2 sm:gap-3 lg:gap-4 ${i === 2 ? 'hidden md:flex' : ''} ${i === 1 ? 'hidden min-[425px]:flex' : ''}`}
          >
            {col.map((h, j) => (
              <div key={j} className="skeleton-bar w-full" style={{ height: `${h}vh` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
