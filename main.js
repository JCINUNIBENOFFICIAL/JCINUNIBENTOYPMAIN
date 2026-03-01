// Function to toggle the navbar visibility on mobile
function toggleMenu() {
  const nav = document.querySelector("nav");
  nav.classList.toggle("active"); // Toggle the 'active' class on <nav>
}

// Dropdown menu functionality
document.addEventListener('DOMContentLoaded', function() {
  const dropdowns = document.querySelectorAll('.dropdown');
  
  dropdowns.forEach(dropdown => {
    const link = dropdown.querySelector('a');
    
    // Toggle dropdown on click
    link.addEventListener('click', function(e) {
      e.preventDefault();
      dropdown.classList.toggle('active');
      
      // Close other dropdowns
      dropdowns.forEach(other => {
        if (other !== dropdown) {
          other.classList.remove('active');
        }
      });
    });
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    dropdowns.forEach(dropdown => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  });
});

window.addEventListener('load', function() {
  var preloader = document.getElementById('creative-preloader');
  if (preloader) {
    preloader.style.display = 'none';
  }
});

const today = new Date();
const currentYear = today.getFullYear();

document.querySelector('.year').innerHTML = currentYear;