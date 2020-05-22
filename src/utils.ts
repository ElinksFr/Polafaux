function debounce(func: Function, wait = 200, immediate = false): Function {
  let timeout: NodeJS.Timeout | null;
  return function (this: any) {
    const context = this, args = arguments;
    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    if (timeout)
      clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};
export { debounce };
