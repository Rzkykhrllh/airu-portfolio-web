export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-white/10 mt-20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} Airu Photography. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a
              href="https://twitter.com/__airu___"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
            >
              Twitter
            </a>
            <a
              href="https://instagram.com/frame_by_airu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
            >
              Instagram
            </a>
            <a
              href="https://unsplash.com/@airuphotograph"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
            >
              Unsplash
            </a>
            <a
              href="mailto:m.rizky.khairullah@gmail.com"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
