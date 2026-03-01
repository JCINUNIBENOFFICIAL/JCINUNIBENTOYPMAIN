import { showCurrentStep } from "./utils/utils.js";

// as page loads get these dom element and save in thier respective variables
// for cacheing reasons
const nominationForm = document.getElementById("nomination-form");

const nominationFormStep1HTML = document.querySelector(
  ".nomination-form-step-1",
);
const nominationFormStep2HTML = document.querySelector(
  ".nomination-form-step-2",
);
const nominationFormStep3HTML = document.querySelector(
  ".nomination-form-step-3",
);

// El stands for element , btn for button
const nextBtnEl = document.getElementById("next-btn");
const backBtnEl = document.getElementById("back-btn");

let count = 0; //keeps track of current step, I display nomination step based on this



// put the steps html in an array for easy accessibility and manipulation etc
//why?:  steps to nominate is a list that's why they are in an array
const nominationFormStepsList = [
  nominationFormStep1HTML,
  nominationFormStep2HTML,
  nominationFormStep3HTML,
];

const stepValuesStep1 = {
  step1:{},
  step2:{},
  step3:{},
}

let totalNumberOfSteps = nominationFormStepsList.length - 1; //0, 1, 2 so it always return something in the array


function showHideFormNavButtons () {
  console.log(count)
 count === 0 ? 
 backBtnEl.style.opacity = '0' 
 :
  backBtnEl.style.opacity = '1' ; // initially hide back btn
 count ===  totalNumberOfSteps ?  nextBtnEl.innerHTML = 'Submit' : nextBtnEl.innerHTML = 'Next';
}

showHideFormNavButtons();

async function moveToNextStep() {

  if (count < 0) {
    count = 0;
  } else if (count >= totalNumberOfSteps) {

    count = totalNumberOfSteps;
          let success = validateStep3Form();
            if (success) {
                const result = await submitNominationForm();
              }
  } else {
    if (count === 0) {
      let success = validateStep1Form();
      success ? count++ : (count = 0);
    }else if(count === 1){
       let success = validateStep2Form();
       success ? count++ : (count = 1);
    }
  }
  showHideFormNavButtons()
  showCurrentStep(nominationFormStepsList, count);
}

function moveToPrevStep() {
  if (count <= 0) {
    count = 0;
  } else if (count > totalNumberOfSteps) {
    count = totalNumberOfSteps;
  } else {
    count--;
  }
  showHideFormNavButtons()
  showCurrentStep(nominationFormStepsList, count);
}

nextBtnEl.addEventListener("click", moveToNextStep);




backBtnEl.addEventListener("click", moveToPrevStep);

let validateStep1Form = () => {
  let isSuccess = false;
  const error = []

  let nameOfNomineeVal = document.getElementById("nominee-name").value.trim();
  let emailOfNomineeVal = document.getElementById("nominee-email").value.trim();
  let emailOfNominatorVal = document
    .getElementById("nominator-email")
    .value.trim();
  let genderOfNomineeVal = document.getElementById("gender").value.trim();

  let nameOfNomineeValerrorEL = document.getElementById("nominee-name-error");
  let emailOfNomineeValerrorEl = document.getElementById("nominee-email-error");
  let emailOfNominatorValerrorEl = document.getElementById(
    "nominator-email-error",
  );
  let genderOfNomineeValerrorEl = document.getElementById("gender-error");

  if (nameOfNomineeVal === "") {
    displayErrorMsg(nameOfNomineeValerrorEL, "filed must not be empty",isSuccess, false);
    error.push('name error')
  } else if (nameOfNomineeVal.length < 8) {
    displayErrorMsg(
      nameOfNomineeValerrorEL,
      "must not be less than 8 characters",
      isSuccess,
      false,
    );
    error.push('name error')
  } else {
    nameOfNomineeValerrorEL.innerHTML = "";
    nameOfNomineeValerrorEL.classList.remove("show");
    displayErrorMsg(nameOfNomineeValerrorEL, "", isSuccess, true);
    isSuccess = true;
  }

  if(genderOfNomineeVal === ""){
    displayErrorMsg(genderOfNomineeValerrorEl, 'please select gender', isSuccess,  false);
     error.push('gender error')
  }else{
    displayErrorMsg(genderOfNomineeValerrorEl, "", isSuccess, true);
    isSuccess = true;
  }


  // nominee email validation
  const { msg: nomineeEmailMsg, status: nomineeEmailStatus} = validateEmailInput(emailOfNomineeVal);

      if(!nomineeEmailStatus){
        displayErrorMsg( emailOfNomineeValerrorEl, nomineeEmailMsg, isSuccess, nomineeEmailStatus);
        error.push('nominee error')
      }else{
          displayErrorMsg(emailOfNomineeValerrorEl, nomineeEmailMsg, isSuccess,  nomineeEmailStatus);
      }

  // nominator email validation

    const { msg: nominatorEmailMsg, status: nominatorEmailStatus} = validateEmailInput(emailOfNominatorVal);
  
      if(!nominatorEmailStatus){
        displayErrorMsg( emailOfNominatorValerrorEl, nominatorEmailMsg, isSuccess, nomineeEmailStatus);
        error.push('nominator error')
      }else{
          displayErrorMsg(emailOfNominatorValerrorEl, nominatorEmailMsg, isSuccess,  nominatorEmailStatus);
      }

    if (error.length === 0) {
  stepValuesStep1.step1 = {
    nomineeName: nameOfNomineeVal,
    nomineeEmail: emailOfNomineeVal,
    nominatorEmail: emailOfNominatorVal,
    gender: genderOfNomineeVal,
  };
}

  return  error.length === 0 ? true: false;
};

let validateStep2Form = () => {
  let isSuccess = false;
  const error = [];

  // Values
  const whatsAppNoVal = document.getElementById('whatsapp-contact').value.trim();
  const otherContactVal = document.getElementById('other-contact').value.trim();
  const facultyVal = document.getElementById('faculty').value.trim();
  const departmentVal = document.getElementById('department').value.trim();

  // Error elements
  const whatsAppErrorEl = document.getElementById('whatsapp-error');
  const otherContactErrorEl = document.getElementById('other-contact-error');
  const facultyErrorEl = document.getElementById('faculty-error');
  const departmentErrorEl = document.getElementById('department-error');

  // WhatsApp validation
  const { msg: whatsappMsg, status: whatsappStatus } = validatePhoneNumberInputs(whatsAppNoVal);
  if (!whatsappStatus) {
    displayErrorMsg(whatsAppErrorEl, whatsappMsg, isSuccess, false);
    error.push('whatsapp error');
  } else {
    displayErrorMsg(whatsAppErrorEl, '', isSuccess, true);
    isSuccess = true;
  }

  // Other contact validation (optional)
  if (otherContactVal) {
    const { msg: otherMsg, status: otherStatus } = validatePhoneNumberInputs(otherContactVal);
    if (!otherStatus) {
      displayErrorMsg(otherContactErrorEl, otherMsg, isSuccess, false);
      error.push('other-contact error');
    } else {
      displayErrorMsg(otherContactErrorEl, '', isSuccess, true);
      isSuccess = true;
    }
  } else {
    // optional field, clear error
    displayErrorMsg(otherContactErrorEl, '', isSuccess, true);
    isSuccess = true;
  }

  // Faculty validation
  if (!facultyVal) {
    displayErrorMsg(facultyErrorEl, 'please select a faculty', isSuccess, false);
    error.push('faculty error');
  } else {
    displayErrorMsg(facultyErrorEl, '', isSuccess, true);
    isSuccess = true;
  }

  // Department validation
  if (!departmentVal) {
    displayErrorMsg(departmentErrorEl, 'department must not be empty', isSuccess, false);
    error.push('department error');
  } else if (departmentVal.length < 3) {
    displayErrorMsg(departmentErrorEl, 'department must be at least 3 characters', isSuccess, false);
    error.push('department error');
  } else {
    displayErrorMsg(departmentErrorEl, '', isSuccess, true);
    isSuccess = true;
  }

  if (error.length === 0) {
  stepValuesStep1.step2 = {
    whatsappContact: whatsAppNoVal,
    otherContact: otherContactVal || null,
    faculty: facultyVal,
    department: departmentVal,
  };
}

  return error.length === 0 ? true : false;
};


let validateStep3Form = () => {
  let isSuccess = false;
  const error = [];

  const levelOfNomineeVal = document.getElementById('level').value.trim();
  const categoryOfNormineeVal = document.getElementById('category').value.trim();
  const socialMediaOfNomineeVal = document.getElementById('social-media-handle').value.trim();
  const reasonOfNominatingNomineeVal = document.getElementById('reason').value.trim();

  // El = element
  const levelOfNomineeValErrorEl = document.getElementById('level-error');
  const categoryOfNormineeValErrorEl = document.getElementById('category-error');
  const socialMediaOfNomineeValErrorEl = document.getElementById('social-media-handle-error');
  const reasonOfNominatingNomineeValErrorEl = document.getElementById('reason-error');

  // level of nominee validation
  if(levelOfNomineeVal === '100' || levelOfNomineeVal ===  '200' || levelOfNomineeVal ===  '300' || levelOfNomineeVal ===  '400' ||   levelOfNomineeVal === '500' || levelOfNomineeVal ===  '600'){
    displayErrorMsg(levelOfNomineeValErrorEl, '', isSuccess, true);
  }else{
     displayErrorMsg(levelOfNomineeValErrorEl, 'levels are between 100 - 500', isSuccess, false);
    error.push('level of nominee value error');
  }

  // category of norminee value validation
  if(categoryOfNormineeVal === ''){
     displayErrorMsg(categoryOfNormineeValErrorEl, 'please select a category', isSuccess, false);
     error.push('category of nominee value error');
  }else{
     displayErrorMsg(categoryOfNormineeValErrorEl, '', isSuccess, true);
  }

  //social media of nominee value nomination
  if(socialMediaOfNomineeVal === ''){
     displayErrorMsg(socialMediaOfNomineeValErrorEl, 'field can not be empty', isSuccess, false);
     error.push('social media of nominee value error');
  }else{
     displayErrorMsg(socialMediaOfNomineeValErrorEl, '', isSuccess, true);
  }

    // category of norminee value validation
  if(reasonOfNominatingNomineeVal === ''){
     displayErrorMsg(reasonOfNominatingNomineeValErrorEl, 'field can not be empty', isSuccess, false);
     error.push('category of nominee value error');
  }else{
     displayErrorMsg(reasonOfNominatingNomineeValErrorEl, '', isSuccess, true);
  }

  if (error.length === 0) {
  stepValuesStep1.step3 = {
    level: levelOfNomineeVal,
    category: categoryOfNormineeVal,
    socialMediaHandle: socialMediaOfNomineeVal,
    reason: reasonOfNominatingNomineeVal,
  };
}

  return error.length === 0 ? true : false ;

}

const buildFinalPayload = () => {
  return {
    ...stepValuesStep1.step1,
    ...stepValuesStep1.step2,
    ...stepValuesStep1.step3,
  };
};

function setLoadingState(isLoading) {
  let submitLoading = isLoading;

  nextBtnEl.disabled = isLoading;
  backBtnEl.disabled = isLoading;

  nextBtnEl.textContent = isLoading ? "Submitting..." : "Next";
}


async function submitNominationForm() {
  const payload = buildFinalPayload();
  setLoadingState(true);

  try {
    const response = await fetch("YOUR_WEB_APP_URL_HERE", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.success) {
      console.log("Nomination submitted successfully!");
      return true;
    } else {
      console.error("Submission error:", result.error);
      return false;
    }
  } catch (err) {
    console.error("Network or script error:", err);
    return false;
  } finally {
    setLoadingState(false);
  }
}



function displayErrorMsg(element, msg, isSuccess, result) {
  element.innerHTML = msg;
  isSuccess = result;
  /* this could have been shorter 
     but i dont want to toggle classlist to avoid unexpected behaviour
     and also makes the func depend on less parameter which is good for readability 
      */
  isSuccess ? element.classList.remove("show") : element.classList.add("show");
}

const validatePhoneNumberInputs = (inputELValue) => {
  let msg = '';
  let status = true;

  // Check for non-numeric characters
  if (!/^\d*$/.test(inputELValue)) {
    msg = 'alphabets, spacing or + are not allowed';
    status = false;
  }
  // Check length
  else if (inputELValue.length !== 11) {
    msg = 'phone number must be equal to 11';
    status = false;
  }

  return { msg, status };
};

const validateEmailInput = (inputELValue) => {
  let msg = '';
  let status = true;
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Required check
  if (!inputELValue) {
    msg= 'email is required'; status = false ;
  }else if (!emailRegex.test(inputELValue)) {
   msg= 'invalid email address'; status = false ;
  }else{
   msg = '', status =  true
  }
  return { msg, status };
};



