export const markEducationDailyChallenge = () => {
  const today = new Date().toDateString();

  try {
    localStorage.setItem('combo-edu-today', today);
    window.dispatchEvent(new CustomEvent('combo-education-access'));
  } catch (error) {
    console.error('Failed to sync education daily challenge', error);
  }
};
