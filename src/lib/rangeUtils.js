// Parses "1-3, 5, 8-10" into Set {1, 2, 3, 5, 8, 9, 10}
export const parseRangeToSet = (rangeStr, maxPages) => {
  const selected = new Set();
  if (!rangeStr.trim()) return selected;

  const parts = rangeStr.split(',');
  for (let part of parts) {
    part = part.trim();
    if (!part) continue;

    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      // Validate: Must be numbers, start <= end, within bounds
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        const actualStart = Math.max(1, start);
        const actualEnd = Math.min(maxPages, end);
        for (let i = actualStart; i <= actualEnd; i++) {
          selected.add(i);
        }
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= 1 && num <= maxPages) {
        selected.add(num);
      }
    }
  }
  return selected;
};

// Compresses Set {1, 2, 3, 5, 8, 9, 10} into "1-3, 5, 8-10"
export const createRangeString = (selectedSet) => {
  if (selectedSet.size === 0) return "";
  
  const nums = Array.from(selectedSet).sort((a, b) => a - b);
  const ranges = [];
  let start = nums[0];
  let end = nums[0];

  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === end + 1) {
      end = nums[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = nums[i];
      end = nums[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(', ');
};