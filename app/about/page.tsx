export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-4">About</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Capturing moments, telling stories through the lens
          </p>
        </div>

        {/* Bio */}
        <div className="prose dark:prose-invert max-w-none">
          <h2 className="text-2xl font-semibold mb-4">Biography</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            I'm a photographer passionate about capturing the beauty of everyday
            moments and extraordinary places. With over a decade of experience,
            I specialize in landscape, portrait, and street photography.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            My work has been featured in various publications and exhibitions
            around the world. I believe that photography is not just about
            capturing what we see, but about revealing what we feel.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Based between New York and Tokyo, I'm always seeking new
            perspectives and stories to tell through my camera.
          </p>
        </div>

        {/* Equipment */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Equipment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Cameras</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>Sony A7R IV</li>
                <li>Canon EOS R5</li>
                <li>Nikon Z9</li>
                <li>Leica Q2</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Lenses</h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>Sony FE 24-70mm f/2.8 GM</li>
                <li>Canon RF 85mm f/1.2L</li>
                <li>Nikkor Z 14-24mm f/2.8 S</li>
                <li>Sony FE 70-200mm f/2.8 GM</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p>
              <span className="text-gray-600 dark:text-gray-400">Email:</span>{' '}
              <a
                href="mailto:contact@example.com"
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                contact@example.com
              </a>
            </p>
            <p>
              <span className="text-gray-600 dark:text-gray-400">Instagram:</span>{' '}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                @photographer
              </a>
            </p>
            <p>
              <span className="text-gray-600 dark:text-gray-400">Twitter:</span>{' '}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                @photographer
              </a>
            </p>
          </div>
        </div>

        {/* Availability */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <h2 className="text-2xl font-semibold mb-4">
            Available for Collaborations
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            I'm currently accepting select commercial and editorial projects.
            If you'd like to work together, please reach out via email.
          </p>
          <a
            href="mailto:contact@example.com"
            className="inline-block px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
          >
            Contact Me
          </a>
        </div>
      </div>
    </div>
  );
}
