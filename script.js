const STARTING_POINTS = 420;
const NEXT_MILESTONE = 500;
const ROTATION_INTERVAL = 10000;

const activeUserProfile = {
  displayName: "Sarah Johnson"
};

const requiredDocuments = [
  { name: "W-2", status: "received" },
  { name: "Driver License", status: "received" },
  { name: "1095-A", status: "missing" },
  { name: "1099-INT", status: "missing" },
  { name: "Prior-year Return", status: "received" }
];

const filingScenarios = {
  efile: {
    method: "E-file",
    progress: 35,
    currentStage: "Waiting for Documents",
    currentStatus: "Waiting for Documents",
    waitingOn: "Client",
    nextAction: "Review missing documents",
    cta: "Upload Document",
    steps: [
      "Drop-off received",
      "Build checklist",
      "Complete to-dos",
      "Prepare return",
      "Review, sign & pay",
      "Submit to IRS",
      "IRS accepted / filing complete"
    ],
    activeStep: 2
  },
  paper: {
    method: "Paper file",
    progress: 35,
    currentStage: "Waiting for Documents",
    currentStatus: "Waiting for Documents",
    waitingOn: "Client",
    nextAction: "Review missing documents",
    cta: "Upload Document",
    steps: [
      "Drop-off received",
      "Build checklist",
      "Complete to-dos",
      "Prepare return",
      "Review, sign & pay",
      "Pick up mailing package",
      "Mail return to IRS/state",
      "IRS/state received"
    ],
    activeStep: 2
  }
};

const recommendations = [
  {
    title: "529 Education Savings Guidance",
    priority: "High priority",
    kicker: "Most relevant next step",
    description: "Explore whether a state-sponsored education savings plan could help you prepare for future school costs while keeping tax benefits in view.",
    cta: "Learn about 529 plans",
    points: 75,
    message: "529 guidance opened. Sarah earned 75 Compass points.",
    completedText: "Added to plan"
  },
  {
    title: "Mid-Year Tax Checkup",
    priority: "Recommended",
    kicker: "Timely tax planning",
    description: "Review withholding, credits, and life changes now so tax season feels less like a surprise and more like a plan.",
    cta: "Start checkup",
    points: 50,
    message: "Mid-year tax checkup added. Sarah earned 50 Compass points.",
    completedText: "Added to plan"
  },
  {
    title: "Childcare FSA Opportunity",
    priority: "Worth reviewing",
    kicker: "Benefits window watch",
    description: "See whether setting aside pre-tax dollars for eligible childcare expenses could fit your family's benefits enrollment window.",
    cta: "Review options",
    points: 40,
    message: "Childcare FSA review started. Sarah earned 40 Compass points.",
    completedText: "Added to plan"
  }
];

const statusColors = {
  "High priority": {
    status: "var(--amber)",
    text: "var(--amber)",
    soft: "var(--amber-soft)"
  },
  Recommended: {
    status: "var(--green)",
    text: "var(--green-dark)",
    soft: "var(--green-soft)"
  },
  "Worth reviewing": {
    status: "var(--blue)",
    text: "var(--blue-dark)",
    soft: "var(--blue-soft)"
  }
};

let points = STARTING_POINTS;
let activeRecommendation = 0;
let activeFilingScenario = "efile";
let showCompletedSteps = false;
let carouselTimer;
let rotationStartedAt = 0;
let elapsedBeforePause = 0;
let isCarouselPaused = false;
let pendingUploadDocument = null;

const navItems = document.querySelectorAll(".nav-item");
const pageViews = document.querySelectorAll(".page-view");
const rewardsShortcut = document.querySelector("#rewardsShortcut");
const hamburgerButton = document.querySelector("#hamburgerButton");
const hamburgerMenu = document.querySelector("#hamburgerMenu");
const menuItems = document.querySelectorAll(".menu-item");
const menuStatus = document.querySelector("#menuStatus");
const dashboardEyebrow = document.querySelector("#dashboardEyebrow");
const dashboardWelcome = document.querySelector("#dashboardWelcome");
const scenarioButtons = document.querySelectorAll(".scenario-button");
const filingMethod = document.querySelector("#filingMethod");
const filingProgressPercent = document.querySelector("#filingProgressPercent");
const filingProgressFill = document.querySelector("#filingProgressFill");
const filingCurrentStage = document.querySelector("#filingCurrentStage");
const filingCurrentStatus = document.querySelector("#filingCurrentStatus");
const filingWaitingOn = document.querySelector("#filingWaitingOn");
const filingNextAction = document.querySelector("#filingNextAction");
const filingCta = document.querySelector("#filingCta");
const filingStatusMessage = document.querySelector("#filingStatusMessage");
const completedStepsToggle = document.querySelector("#completedStepsToggle");
const filingSteps = document.querySelector("#filingSteps");
const documentReceivedSummary = document.querySelector("#documentReceivedSummary");
const documentMissingSummary = document.querySelector("#documentMissingSummary");
const viewDocumentsCta = document.querySelector("#viewDocumentsCta");
const documentPageReceivedSummary = document.querySelector("#documentPageReceivedSummary");
const documentPageMissingSummary = document.querySelector("#documentPageMissingSummary");
const requiredDocumentList = document.querySelector("#requiredDocumentList");
const uploadModal = document.querySelector("#uploadModal");
const uploadModalTitle = document.querySelector("#upload-modal-title");
const uploadModalDescription = document.querySelector("#uploadModalDescription");
const documentFileInput = document.querySelector("#documentFileInput");
const selectedFileName = document.querySelector("#selectedFileName");
const cancelUpload = document.querySelector("#cancelUpload");
const confirmUpload = document.querySelector("#confirmUpload");
const pointsEarned = document.querySelector("#pointsEarned");
const rewardProgress = document.querySelector("#rewardProgress");
const milestoneText = document.querySelector("#milestoneText");
const rewardActions = document.querySelectorAll(".reward-action");
const recommendationCarousel = document.querySelector(".recommendation-carousel");
const recommendationPriority = document.querySelector("#recommendationPriority");
const recommendationPoints = document.querySelector("#recommendationPoints");
const recommendationKicker = document.querySelector("#recommendationKicker");
const recommendationTitle = document.querySelector("#recommendationTitle");
const recommendationDescription = document.querySelector("#recommendationDescription");
const recommendationCta = document.querySelector("#recommendationCta");
const recommendationIndex = document.querySelector("#recommendationIndex");
const recommendationProgress = document.querySelector("#recommendationProgress");

function updateRewards() {
  pointsEarned.textContent = points;

  const progress = Math.min((points / NEXT_MILESTONE) * 100, 100);
  rewardProgress.style.width = `${progress}%`;

  if (points >= NEXT_MILESTONE) {
    milestoneText.textContent = "Milestone reached: Tax Season Ready";
  } else {
    milestoneText.textContent = `${NEXT_MILESTONE - points} points to Tax Season Ready`;
  }
}

function updateDashboardHeader() {
  dashboardEyebrow.textContent = `${activeUserProfile.displayName}'s dashboard`;
  dashboardWelcome.textContent = `Welcome ${activeUserProfile.displayName}`;
}

function getDocumentCounts() {
  const received = requiredDocuments.filter((documentItem) => documentItem.status === "received").length;
  const total = requiredDocuments.length;
  const missing = total - received;

  return { received, total, missing };
}

function renderDocumentSummary() {
  const { received, total, missing } = getDocumentCounts();
  const missingLabel = missing === 1 ? "document missing" : "documents missing";

  documentReceivedSummary.textContent = `${received} of ${total} documents received`;
  documentMissingSummary.textContent = `${missing} ${missingLabel}`;
  documentPageReceivedSummary.textContent = `${received} of ${total}`;
  documentPageMissingSummary.textContent = `${missing} missing`;
}

function renderRequiredDocuments() {
  requiredDocumentList.innerHTML = "";

  requiredDocuments.forEach((documentItem) => {
    const item = document.createElement("li");
    item.className = `required-document-item ${documentItem.status}`;

    const name = document.createElement("strong");
    name.textContent = documentItem.name;

    const status = document.createElement("span");
    status.className = "document-status";
    status.textContent = documentItem.status === "received" ? "Received" : "Missing";

    item.append(name, status);

    if (documentItem.status === "missing") {
      const uploadButton = document.createElement("button");
      uploadButton.className = "upload-button";
      uploadButton.type = "button";
      uploadButton.textContent = "Upload";
      uploadButton.setAttribute("aria-label", `Upload ${documentItem.name}`);
      uploadButton.addEventListener("click", () => openUploadModal(documentItem));
      item.appendChild(uploadButton);
    }

    requiredDocumentList.appendChild(item);
  });
}

function renderDocuments() {
  renderDocumentSummary();
  renderRequiredDocuments();
}

function renderFilingScenario() {
  const scenario = filingScenarios[activeFilingScenario];

  scenarioButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.scenario === activeFilingScenario);
  });

  filingMethod.textContent = `Filing method: ${scenario.method}`;
  filingProgressPercent.textContent = `${scenario.progress}%`;
  filingProgressFill.style.width = `${scenario.progress}%`;
  filingCurrentStage.textContent = scenario.currentStage;
  filingCurrentStatus.textContent = scenario.currentStatus;
  filingWaitingOn.textContent = scenario.waitingOn;
  filingNextAction.textContent = scenario.nextAction;
  filingCta.textContent = scenario.cta;
  filingStatusMessage.textContent = "";
  completedStepsToggle.textContent = showCompletedSteps ? "Hide completed" : "Show completed";

  filingSteps.innerHTML = "";
  scenario.steps.forEach((step, index) => {
    const isCompleted = index < scenario.activeStep;

    if (isCompleted && !showCompletedSteps) {
      return;
    }

    const item = document.createElement("li");
    item.className = "filing-step";

    if (isCompleted) {
      item.classList.add("completed");
    } else if (index === scenario.activeStep) {
      item.classList.add("current");
    }

    const marker = document.createElement("span");
    marker.className = "step-marker";
    marker.textContent = isCompleted ? "✓" : index + 1;

    const label = document.createElement("span");
    label.textContent = step;

    item.append(marker, label);
    filingSteps.appendChild(item);
  });

  renderDocumentSummary();
}

function getActiveRecommendation() {
  return recommendations[activeRecommendation];
}

function renderProgressSegments() {
  recommendationProgress.innerHTML = "";
  recommendationProgress.style.setProperty("--segment-count", recommendations.length);

  recommendations.forEach((recommendation, index) => {
    const segment = document.createElement("button");
    segment.className = "carousel-segment";
    segment.type = "button";
    segment.setAttribute("aria-label", `Show ${recommendation.title}`);
    segment.addEventListener("click", () => {
      showRecommendation(index);
      startCarousel();
    });
    recommendationProgress.appendChild(segment);
  });
}

function updateCarousel() {
  const recommendation = getActiveRecommendation();
  const colors = statusColors[recommendation.priority] || statusColors.Recommended;
  const segments = recommendationProgress.querySelectorAll(".carousel-segment");

  recommendationCarousel.style.setProperty("--recommendation-status", colors.status);
  recommendationCarousel.style.setProperty("--recommendation-status-text", colors.text);
  recommendationCarousel.style.setProperty("--recommendation-status-soft", colors.soft);
  recommendationPriority.textContent = recommendation.priority;
  recommendationPoints.textContent = `+${recommendation.points} pts`;
  recommendationKicker.textContent = recommendation.kicker;
  recommendationTitle.textContent = recommendation.title;
  recommendationDescription.textContent = recommendation.description;
  recommendationIndex.textContent = `${activeRecommendation + 1} of ${recommendations.length}`;
  recommendationCta.textContent = recommendation.completed ? recommendation.completedText : recommendation.cta;
  recommendationCta.classList.toggle("completed", Boolean(recommendation.completed));

  segments.forEach((segment, index) => {
    const isActive = index === activeRecommendation;
    segment.classList.toggle("active", isActive);
    segment.classList.toggle("seen", index < activeRecommendation);
    segment.setAttribute("aria-current", isActive ? "true" : "false");
  });
}

function showRecommendation(index) {
  activeRecommendation = (index + recommendations.length) % recommendations.length;
  updateCarousel();
}

function showNextRecommendation() {
  showRecommendation(activeRecommendation + 1);
}

function stopCarousel() {
  clearTimeout(carouselTimer);
  carouselTimer = undefined;
}

function startCarousel() {
  stopCarousel();
  elapsedBeforePause = 0;
  rotationStartedAt = Date.now();
  recommendationCarousel.classList.remove("paused");
  recommendationProgress.style.setProperty("--segment-start", "0%");
  recommendationProgress.style.setProperty("--rotation-duration", `${ROTATION_INTERVAL}ms`);
  restartProgressAnimation();
  carouselTimer = setTimeout(advanceCarousel, ROTATION_INTERVAL);
}

function advanceCarousel() {
  showNextRecommendation();
  startCarousel();
}

function pauseCarousel() {
  if (isCarouselPaused) {
    return;
  }

  isCarouselPaused = true;
  elapsedBeforePause = Math.min(Date.now() - rotationStartedAt, ROTATION_INTERVAL);
  stopCarousel();
  recommendationCarousel.classList.add("paused");
}

function resumeCarousel() {
  if (!isCarouselPaused) {
    return;
  }

  isCarouselPaused = false;
  const remaining = Math.max(ROTATION_INTERVAL - elapsedBeforePause, 0);
  const progress = (elapsedBeforePause / ROTATION_INTERVAL) * 100;

  rotationStartedAt = Date.now() - elapsedBeforePause;
  recommendationCarousel.classList.remove("paused");
  recommendationProgress.style.setProperty("--segment-start", `${progress}%`);
  recommendationProgress.style.setProperty("--rotation-duration", `${remaining}ms`);
  restartProgressAnimation();
  carouselTimer = setTimeout(advanceCarousel, remaining);
}

function resumeCarouselWhenLeaving(event) {
  if (event.relatedTarget && recommendationCarousel.contains(event.relatedTarget)) {
    return;
  }

  resumeCarousel();
}

function restartProgressAnimation() {
  const activeSegment = recommendationProgress.querySelector(".carousel-segment.active");

  if (!activeSegment) {
    return;
  }

  activeSegment.classList.remove("active");
  activeSegment.offsetHeight;
  activeSegment.classList.add("active");
}

function openMenu() {
  hamburgerMenu.hidden = false;
  hamburgerButton.setAttribute("aria-expanded", "true");
  hamburgerButton.setAttribute("aria-label", "Close menu");
}

function closeMenu() {
  hamburgerMenu.hidden = true;
  hamburgerButton.setAttribute("aria-expanded", "false");
  hamburgerButton.setAttribute("aria-label", "Open menu");
}

function toggleMenu() {
  if (hamburgerMenu.hidden) {
    openMenu();
  } else {
    closeMenu();
  }
}

function showPage(sectionName) {
  const visibleSection = sectionName === "Document" ? "Document" : "Dashboard";

  pageViews.forEach((page) => {
    const isActive = page.dataset.page === visibleSection;
    page.classList.toggle("active", isActive);
    page.hidden = !isActive;
  });

  navItems.forEach((navItem) => {
    navItem.classList.toggle("active", navItem.dataset.section === sectionName);
  });

  if (visibleSection === "Document") {
    renderDocuments();
  }

  closeMenu();
}

function openUploadModal(documentItem) {
  pendingUploadDocument = documentItem;
  uploadModalTitle.textContent = `Upload ${documentItem.name}`;
  uploadModalDescription.textContent = `Choose a file to mark ${documentItem.name} as received.`;
  documentFileInput.value = "";
  selectedFileName.textContent = "No file selected";
  confirmUpload.disabled = true;

  if (typeof uploadModal.showModal === "function") {
    uploadModal.showModal();
  } else {
    uploadModal.setAttribute("open", "");
  }
}

function closeUploadModal() {
  uploadModal.close();
  pendingUploadDocument = null;
}

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    showPage(item.dataset.section);
  });
});

scenarioButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilingScenario = button.dataset.scenario;
    renderFilingScenario();
  });
});

completedStepsToggle.addEventListener("click", () => {
  showCompletedSteps = !showCompletedSteps;
  renderFilingScenario();
});

hamburgerButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleMenu();
});

hamburgerMenu.addEventListener("click", (event) => {
  event.stopPropagation();
});

rewardsShortcut.addEventListener("click", (event) => {
  event.stopPropagation();
  rewardsShortcut.classList.add("active");
  rewardsShortcut.setAttribute("aria-label", "Rewards selected");
  closeMenu();
});

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    if (item.dataset.menuSection === "Checklist") {
      window.location.href = "checklist.html";
      return;
    }

    menuItems.forEach((menuItem) => menuItem.classList.remove("active"));
    item.classList.add("active");
    menuStatus.textContent = `${item.dataset.menuSection} selected`;
    closeMenu();
  });
});

document.addEventListener("click", () => {
  closeMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});

filingCta.addEventListener("click", () => {
  showPage("Document");
  filingStatusMessage.textContent = "";
});

viewDocumentsCta.addEventListener("click", () => {
  showPage("Document");
});

documentFileInput.addEventListener("change", () => {
  const [file] = documentFileInput.files;
  selectedFileName.textContent = file ? file.name : "No file selected";
  confirmUpload.disabled = !file;
});

cancelUpload.addEventListener("click", closeUploadModal);

uploadModal.addEventListener("close", () => {
  pendingUploadDocument = null;
});

confirmUpload.addEventListener("click", () => {
  if (!pendingUploadDocument) {
    return;
  }

  pendingUploadDocument.status = "received";
  renderDocuments();
  renderFilingScenario();
  closeUploadModal();
});

recommendationCarousel.addEventListener("pointerenter", pauseCarousel);
recommendationCarousel.addEventListener("pointerleave", resumeCarousel);
recommendationCarousel.addEventListener("mouseenter", pauseCarousel);
recommendationCarousel.addEventListener("mouseleave", resumeCarousel);
recommendationCarousel.addEventListener("mouseover", pauseCarousel);
recommendationCarousel.addEventListener("mouseout", resumeCarouselWhenLeaving);
recommendationCarousel.addEventListener("focusin", pauseCarousel);
recommendationCarousel.addEventListener("focusout", resumeCarouselWhenLeaving);

recommendationCta.addEventListener("click", () => {
  const recommendation = getActiveRecommendation();

  if (recommendation.completed) {
    return;
  }

  recommendation.completed = true;
  points += recommendation.points;
  updateRewards();
  updateCarousel();
});

rewardActions.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.classList.contains("completed")) {
      return;
    }

    const earnedPoints = Number(button.dataset.points);
    points += earnedPoints;
    updateRewards();

    button.classList.add("completed");

    if (!button.classList.contains("action-item")) {
      button.textContent = "Added to plan";
    }
  });
});

renderProgressSegments();
updateDashboardHeader();
renderFilingScenario();
renderDocuments();
updateCarousel();
startCarousel();
updateRewards();
