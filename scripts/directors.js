const directors2026 = [
  {
    id: 1,
    name: "Ejime Senorita",
    role: "Publicity Team Lead",
    image: "/images/directors-2026/Ejime Senorita.jpeg",
    message:
      "As President, Daniel leads with integrity and vision, ensuring the continued growth and impact of JCI UNIBEN within the university and beyond.",
    socialLinks: {
      twitter: "https://x.com/danielosayande",
      instagram: "https://instagram.com/danielosayande",
    },
  },
  {
    id: 2,
    name: " Emmanuel Success Osaretemen ",
    role: "Nomination and Screening Team Lead",
    image: "/images/directors-2026/Emmanuel Success.jpeg",
    message:
      "Precious oversees strategic initiatives and membership engagement, fostering collaboration and excellence across all committees.",
    socialLinks: {
      twitter: "https://x.com/preciousaigbokhan",
      instagram: "https://instagram.com/preciousaigbokhan",
    },
  },
  {
    id: 3,
    name: "GOODLUCK CHINENYE CHILAKA",
    role: "Content writing and communication.",
    image: "/images/directors-2026/GOODLUCK CHINENYE CHILAKA.jpeg",
    message:
      "Michael coordinates impactful programs that empower young leaders to create sustainable change within the UNIBEN community.",
    socialLinks: {
      linkedin: "https://www.linkedin.com/in/goodluck-chilaka-70ba2a337?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      twitter: "https://x.com/michaelegharevba",
      instagram: "https://instagram.com/michaelegharevba",
    },
  },
  {
    id: 4,
    name: "Miracle Ididi",
    role: "Community manager",
    image: "/images/directors-2026/Miracle Ididi.jpeg",
    message:
      "Stephanie leads branding and communications, ensuring the JCI UNIBEN message is delivered with clarity, excellence, and innovation.",
    socialLinks: {
      twitter: "https://x.com/stephanieigiehon",
      instagram: "https://instagram.com/stephanieigiehon",
    },
  },
  {
    id: 5,
    name: "Orubu onoriode Godsfavour",
    role: "Product management",
    image: "/images/directors-2026/Orubu onoriode Godsfavour.jpeg",
    message:
      "Victor manages financial planning and accountability, strengthening transparency and sustainability across all initiatives.",
    socialLinks: {
      twitter: "https://x.com/victoromoregie",
      instagram: "https://instagram.com/victoromoregie",
    },
  },
  {
    id: 6,
    name: "Osarenkhoe Desmond",
    role: "Sponsorship and Partnership team lead",
    image: "/images/directors-2026/Osarenkhoe Desmond.jpeg",
    message:
      "Victor manages financial planning and accountability, strengthening transparency and sustainability across all initiatives.",
    socialLinks: {
      linkedin: "https://www.linkedin.com/in/desmond-osarenkhoe-9b3320341?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      twitter: "https://x.com/victoromoregie",
      instagram: "https://instagram.com/victoromoregie",
    },
  },
  {
    id: 6,
    name: "Warmate William",
    role: "Presentation design",
    image: "/images/directors-2026/warmate-williams.jpeg",
    message:
      "Victor manages financial planning and accountability, strengthening transparency and sustainability across all initiatives.",
    socialLinks: {
      linkedin: "https://www.linkedin.com/in/william-warmate-214538359?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
      twitter: "https://x.com/victoromoregie",
      instagram: "https://instagram.com/victoromoregie",
    },
  },
];

let generateDirectorCard = (id, name, image, role, socialLinks) => {
    const linkedin = socialLinks?.linkedin || null;

  return `
           <figure data-id = "${id}" class="director-card-2026 card-${id}">
              <img src= "${image}" alt="${name}" />
              <figcaption>
                <p class="name">${name}</p>
                <p class="position">${role}</p>
              </figcaption>
              <div class="social-media-container">

              ${linkedin
                ?  
                `               <a href="${linkedin}" target="_blank">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38.51 38.51" id="linkedin">
  <defs>
    <linearGradient id="a" x1="2.05" x2="36.46" y1="2.05" y2="36.46" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#000000"></stop>
      <stop offset="1" stop-color="#000000"></stop>
    </linearGradient>
  </defs>
  <g style="isolation:isolate">
    <g>
      <g>
        <g>
          <rect width="38.51" height="38.51" fill="url(#a)" rx="6.97" ry="6.97"></rect>
          <path fill="#000000" d="M38.48,32.24v-7.88s-.03-.03-.04-.04c-.05-.04-.09-.09-.13-.13-.05-.04-.09-.09-.13-.13-1.7-1.71-5.71-5.71-7.41-7.41-.88-.86-2.18-1.36-4.1-1.36-1.62,0-2.87.62-3.7,1.4v-.07h-.13v-.13h-.13v-.13h-.13v-.13h-.13v-.13h-.13v-.13h-.13v-.13h-.13v-.13h-1.21s-.07-.07-.11-.11c-.04-.05-.09-.09-.13-.13-2.2-2.2-4.4-4.4-6.6-6.6-.51-.55-1.24-.9-2.04-.9-1.55,0-2.81,1.26-2.81,2.8,0,.81.35,1.53.9,2.05.85.85,1.7,1.71,2.56,2.56.04.05.09.09.13.13.04.05.09.09.13.13.02.02.03.04.05.06h-3.39v15.56c1.76,1.52,5.54,5.75,7.28,7.28h15.37c3.6-.39,6.1-3.31,6.34-6.26Z" style="mix-blend-mode:multiply"></path>
          <g>
            <path fill="#fff" d="M9.48 15.74h4.85v15.56h-4.85v-15.56zM11.91 8.01c1.55 0 2.8 1.26 2.8 2.8s-1.26 2.81-2.8 2.81-2.81-1.26-2.81-2.81 1.26-2.8 2.81-2.8M17.36 15.74h4.64v2.13h.06c.65-1.22 2.23-2.51 4.58-2.51 4.9 0 5.8 3.22 5.8 7.41v8.54h-4.83v-7.57c0-1.81-.04-4.13-2.51-4.13s-2.9 1.97-2.9 4v7.7h-4.84v-15.56z"></path>
          </g>
        </g>
      </g>
    </g>
  </g>
</svg>
               </a>`
                :
                 ''
                }

              </div>
            </figure>
    `;
};

// Remeber El means element
const cardsContainerEl = document.querySelector(".card-container");

const initStackState = () => {
  const cards = document.querySelectorAll(".director-card-2026");

  cards.forEach((card, index) => {
    card.dataset.index = index;

    card.classList.add(index % 2 === 0 ? "dropped-left" : "dropped-right");
  });

  // First card starts as top
  const firstCard = cards[0];
  firstCard.classList.remove("dropped-left", "dropped-right");
  firstCard.classList.add("top-card");
};

const initStackScroll = () => {
  const cards = document.querySelectorAll(".director-card-2026");

  let currentTopIndex = 0;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const index = Number(entry.target.dataset.index);

        if (index !== currentTopIndex) {
          const previousCard = cards[currentTopIndex];

          // Drop previous
          previousCard.classList.remove("top-card");
          previousCard.classList.add(
            currentTopIndex % 2 === 0 ? "dropped-left" : "dropped-right",
          );

          // Straighten new
          entry.target.classList.remove("dropped-left", "dropped-right");
          entry.target.classList.add("top-card");

          currentTopIndex = index;
        }
      });
    },
    {
      threshold: 0.65,
    },
  );

  cards.forEach((card) => observer.observe(card));
};

const displayDirectorCards = () => {
  cardsContainerEl.innerHTML = directors2026
    .map((d) => generateDirectorCard(d.id, d.name, d.image, d.role , d.socialLinks))
    .join("");

  initStackState();
initStackScroll();
};

displayDirectorCards();
