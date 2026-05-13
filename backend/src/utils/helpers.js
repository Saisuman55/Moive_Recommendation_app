/**
 * Converts a string to a URL-friendly slug
 * @param {string} str - The string to convert
 * @returns {string} - URL-friendly slug
 */
export const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
};

/**
 * Extracts movie slug from a URL string (e.g., "interstellar" from "/movie/interstellar")
 * @param {string} url - The URL or path string
 * @returns {string} - The slug extracted from the URL
 */
export const extractSlugFromUrl = (url) => {
  if (!url) return "";
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1];
};

/**
 * Capitalizes the first letter of a string
 * @param {string} str - The string to capitalize
 * @returns {string} - Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Formats a number as currency (e.g., budget, revenue)
 * @param {number} num - The number to format
 * @returns {string} - Formatted currency string (e.g., "$100M")
 */
export const formatCurrency = (num) => {
  if (!num || typeof num !== "number") return "N/A";
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num}`;
};

/**
 * Formats a duration string from minutes (e.g., 120 -> "2h 0m")
 * @param {number} minutes - Duration in minutes
 * @returns {string} - Formatted duration string
 */
export const formatDuration = (minutes) => {
  if (!minutes || typeof minutes !== "number" || minutes <= 0) return "N/A";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

/**
 * Generates a random avatar color based on a string (e.g., actor name)
 * @param {string} str - The seed string
 * @returns {string} - A hex color string
 */
export const getAvatarColor = (str) => {
  const colors = [
    "#E57373",
    "#F06292",
    "#BA68C8",
    "#9575CD",
    "#7986CB",
    "#64B5F6",
    "#4FC3F7",
    "#4DD0E1",
    "#4DB6AC",
    "#81C784",
    "#AED581",
    "#DCE775",
    "#FFF176",
    "#FFD54F",
    "#FFB74D",
    "#FF8A65",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + (hash << 5) - hash;
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
};

/**
 * Generates initials from a name
 * @param {string} name - Full name
 * @returns {string} - Initials (e.g., "Tom Hanks" -> "TH")
 */
export const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Safely parses a JSON string, returning a default value if parsing fails
 * @param {string} jsonString - The JSON string to parse
 * @param {any} defaultValue - The default value to return if parsing fails
 * @returns {any} - Parsed JSON or default value
 */
export const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Debounces a function
 * @param {Function} func - The function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

/**
 * Throttles a function (ensures it is called at most once per wait period)
 * @param {Function} func - The function to throttle
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (func, wait) => {
  let lastTime = 0;
  return function (...args) {
    const now = new Date().getTime();
    if (now - lastTime >= wait) {
      func.apply(this, args);
      lastTime = now;
    }
  };
};

/**
 * Generates a random string (useful for unique IDs or slugs)
 * @param {number} length - Length of the string
 * @returns {string} - Random string
 */
export const generateRandomString = (length = 8) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default {
  slugify,
  extractSlugFromUrl,
  capitalize,
  formatCurrency,
  formatDuration,
  getAvatarColor,
  getInitials,
  safeJsonParse,
  debounce,
  throttle,
  generateRandomString,
};