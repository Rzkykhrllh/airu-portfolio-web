// Shared admin class tokens — one place for the admin look so every page,
// modal and form control matches. Neutral palette (Tailwind `gray` is remapped
// to `neutral`), near-black accent like the public site, hairline borders.

/** White surface card on the off-white page background. */
export const card =
  'bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-xl';

/** Text input / textarea. */
export const field =
  'w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-900 dark:focus:border-gray-300 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 transition-colors';

export const textarea = field.replace('h-10', 'min-h-[6rem] py-2');

/** Native <select>, with a custom chevron. */
export const select =
  'h-10 pl-3 pr-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-900 dark:focus:border-gray-300 focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 appearance-none bg-no-repeat bg-[length:16px] bg-[right_0.6rem_center] bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27%23737373%27%3E%3Cpath%20fill-rule%3D%27evenodd%27%20d%3D%27M5.23%207.21a.75.75%200%20011.06.02L10%2011.17l3.71-3.94a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%27%2F%3E%3C%2Fsvg%3E")] cursor-pointer';

/** Form label. */
export const label = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5';

/** Small uppercase section label. */
export const eyebrow = 'text-[0.6875rem] uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400';

/** Square icon button (toolbar). */
export const iconButton =
  'inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
