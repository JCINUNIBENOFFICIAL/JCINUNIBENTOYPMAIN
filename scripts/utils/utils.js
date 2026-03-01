export function removeAllSteps(list){
     list.forEach((step) => {
      step.style.display = "none";
    });
}

export function showCurrentStep(nominationFormStepsList, count) {
  removeAllSteps(nominationFormStepsList);

  scrollToAnchor("nomination-form");

  const currentStepEl = nominationFormStepsList[count];
  currentStepEl.style.display = "flex";
}


function scrollToAnchor(anchorId) {
  const anchorEl = document.querySelector(`.${anchorId}`);
  if (!anchorEl) return;

  anchorEl.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}