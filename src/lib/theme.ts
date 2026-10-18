/** Where the light or dark choice is saved on this device. */
export const THEME_KEY = "mb-theme";

/** Runs in <head> before the first paint, so a saved choice never flashes the other theme. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
