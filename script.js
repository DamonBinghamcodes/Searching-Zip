// Theme Toggle
const themeToggleBtn = document.getElementById('theme-toggle');
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
  });
}

// Modal Dialog
const dialog = document.querySelector('dialog');
const openModalButton = document.getElementById('open-modal');
if (dialog && openModalButton) {
  const closeButton = dialog.querySelector('button:last-of-type');

  closeButton.addEventListener('click', () => {
    dialog.close();
  });

  openModalButton.addEventListener('click', () => {
    dialog.showModal();
  });

  // Close the modal when clicking outside of it
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
    if (!isInDialog) {
      dialog.close();
    }
  });
}
