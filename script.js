const STARTING_POINTS = 420;
const NEXT_MILESTONE = 500;
const ROTATION_INTERVAL = 10000;
const TODO_LIST_STORAGE_KEY = "myblockTodoItems";
const CHECKLIST_STORAGE_KEY = "myblockChecklistState";

const activeUserProfile = {
  displayName: "Sarah Johnson"
};

const recentDocumentYears = [2025, 2024, 2023, 2022];
const olderDocumentYears = [2021, 2020, 2019, 2018, 2017, 2016];
let documentYears = [...recentDocumentYears];
const requiredDocumentsByYear = {
  2025: [
    { name: "W-2", status: "received" }, { name: "Driver License", status: "received" },
    { name: "1095-A", status: "missing" }, { name: "1099-INT", status: "missing" },
    { name: "Prior-Year Return", status: "received" }
  ],
  2024: [
    { name: "W-2", status: "received" }, { name: "Driver License", status: "received" },
    { name: "1095-A", status: "received" }, { name: "1099-INT", status: "missing" },
    { name: "Prior-Year Return", status: "received" }
  ],
  2023: [
    { name: "W-2", status: "received" }, { name: "Driver License", status: "missing" },
    { name: "1095-A", status: "received" }, { name: "1099-INT", status: "received" },
    { name: "Prior-Year Return", status: "received" }
  ],
  2022: [
    { name: "W-2", status: "received" }, { name: "Driver License", status: "received" },
    { name: "1095-A", status: "received" }, { name: "1099-INT", status: "received" },
    { name: "Prior-Year Return", status: "received" }
  ]
};
olderDocumentYears.forEach((year, index) => {
  requiredDocumentsByYear[year] = [
    { name: "W-2", status: "received" },
    { name: "Driver License", status: "received" },
    { name: "1095-A", status: index % 3 === 0 ? "missing" : "received" },
    { name: "1099-INT", status: "received" },
    { name: "Prior-Year Return", status: "received" }
  ];
});
const historicalFiles = ["Federal Return.pdf", "State Return.pdf", "Signed 8879.pdf", "W-2.pdf", "1099-INT.pdf"];

const experienceQuestions = [
  {
    key: "communication", label: "Communication preference", multiple: true,
    question: "How would you prefer we communicate with you?",
    options: ["Phone Call", "Text Message", "Secure Message (App/Portal)", "In-Office Appointment Only"]
  },
  {
    key: "completion", label: "Completion goal", question: "When would you like your return completed?",
    options: ["Within 24 hours", "1–2 days", "Within one week", "By the end of tax season", "Specific date"]
  },
  {
    key: "review", label: "Review method", question: "How would you like to complete your tax return?",
    options: ["In-office appointment", "Approve Online + Phone Call review", "Approve Online + Video review", "Approve Online (AOL) – no appointment needed"]
  },
  {
    key: "priority", label: "Top priority", question: "What matters most to you this tax season?",
    options: ["Fast completion", "Maximizing refund/savings", "Ongoing tax guidance", "Planning for future financial goals"]
  },
  {
    key: "planning", label: "Future planning interest", question: "Would you like help planning beyond this tax return?",
    options: ["Yes, I’d like guidance and ongoing support", "Maybe — open to learning more", "Not at this time"]
  }
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
    title: "W-4 Adjustment Review",
    priority: "Recommended",
    kicker: "Tax planning",
    description: "Review your current withholding and make sure it aligns with your income, family situation, and tax goals to avoid unexpected tax balances or refunds.",
    cta: "Review W-4",
    points: 50,
    message: "W-4 adjustment review opened. Sarah earned 50 Compass points.",
    completedText: "Added to plan"
  },
  {
    title: "Business Expense Tracking",
    priority: "Worth reviewing",
    kicker: "Business planning",
    description: "Track deductible business expenses throughout the year to simplify tax preparation and maximize eligible deductions.",
    cta: "Explore Tracking",
    points: 40,
    message: "Business expense tracking opened. Sarah earned 40 Compass points.",
    completedText: "Added to plan"
  },
  {
    title: "College Savings Planning",
    priority: "Recommended",
    kicker: "Education planning",
    description: "Explore education savings opportunities such as 529 plans and build a strategy for future education expenses.",
    cta: "Learn More",
    points: 50,
    message: "College savings planning opened. Sarah earned 50 Compass points.",
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
let activeDocumentMode = "upload";
let activeDocumentYear = 2025;
let pendingTodoRemoval = null;
let activeExperienceQuestion = 0;
let experienceSetupComplete = false;
const experienceAnswers = {};

const navItems = document.querySelectorAll(".nav-item");
const pageViews = document.querySelectorAll(".page-view");
const rewardsShortcut = document.querySelector("#rewardsShortcut");
const hamburgerButton = document.querySelector("#hamburgerButton");
const hamburgerMenu = document.querySelector("#hamburgerMenu");
const menuItems = document.querySelectorAll(".menu-item");
const menuStatus = document.querySelector("#menuStatus");
const dashboardEyebrow = document.querySelector("#dashboardEyebrow");
const dashboardWelcome = document.querySelector("#dashboardWelcome");
const taxTipsShortcut = document.querySelector("#taxTipsShortcut");
const personalizedRecommendations = document.querySelector("#personalizedRecommendations");
const experienceSetupContent = document.querySelector("#experienceSetupContent");
const experienceSetup = document.querySelector("#experienceSetup");
const experiencePreferencesToggle = document.querySelector("#experiencePreferencesToggle");
const closeExperienceSetup = document.querySelector("#closeExperienceSetup");
const scenarioButtons = document.querySelectorAll("[data-scenario]");
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
const documentPageMissingSummary = document.querySelector("#documentPageMissingSummary");
const requiredDocumentList = document.querySelector("#requiredDocumentList");
const todoProgressSummary = document.querySelector("#todoProgressSummary");
const todoRemainingSummary = document.querySelector("#todoRemainingSummary");
const todoListItems = document.querySelector("#todoListItems");
const documentModeButtons = document.querySelectorAll("[data-document-mode]");
const uploadDocumentsPanel = document.querySelector("#uploadDocumentsPanel");
const browseDocumentsPanel = document.querySelector("#browseDocumentsPanel");
const taxYearToggle = document.querySelector("#taxYearToggle");
const documentHistory = document.querySelector("#documentHistory");
const uploadModal = document.querySelector("#uploadModal");
const uploadModalTitle = document.querySelector("#upload-modal-title");
const uploadModalDescription = document.querySelector("#uploadModalDescription");
const documentFileInput = document.querySelector("#documentFileInput");
const selectedFileName = document.querySelector("#selectedFileName");
const cancelUpload = document.querySelector("#cancelUpload");
const confirmUpload = document.querySelector("#confirmUpload");
const taskConfirmationModal = document.querySelector("#taskConfirmationModal");
const taskConfirmationDescription = document.querySelector("#taskConfirmationDescription");
const cancelTaskCompletionButton = document.querySelector("#cancelTaskCompletionButton");
const confirmTaskCompletionButton = document.querySelector("#confirmTaskCompletionButton");
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
  if (!pointsEarned || !rewardProgress || !milestoneText) {
    return;
  }

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

function getDocumentCounts(documents = requiredDocumentsByYear[activeDocumentYear]) {
  const received = documents.filter((documentItem) => documentItem.status === "received").length;
  const total = documents.length;
  const missing = total - received;

  return { received, total, missing };
}

function renderDocumentSummary() {
  const currentYearCounts = getDocumentCounts(requiredDocumentsByYear[documentYears[0]]);
  const { missing } = getDocumentCounts();
  const missingLabel = missing === 1 ? "document missing" : "documents missing";

  documentReceivedSummary.textContent = `${currentYearCounts.received} of ${currentYearCounts.total} documents received`;
  documentMissingSummary.textContent = `${currentYearCounts.missing} ${currentYearCounts.missing === 1 ? "document missing" : "documents missing"}`;
  documentPageMissingSummary.textContent = `${missing} missing`;
}

function renderRequiredDocuments() {
  requiredDocumentList.innerHTML = "";

  requiredDocumentsByYear[activeDocumentYear].forEach((documentItem) => {
    const item = document.createElement("li");
    item.className = `required-document-item ${documentItem.status}`;

    const name = document.createElement("strong");
    name.textContent = documentItem.name;

    const status = document.createElement("span");
    status.className = "document-status";
    status.textContent = documentItem.status === "received" ? "Received" : "Missing";

    item.append(name, status);

    const actionButton = document.createElement("button");
    actionButton.className = "upload-button";
    actionButton.type = "button";
    actionButton.textContent = documentItem.status === "missing" ? "Upload" : "View";
    actionButton.setAttribute("aria-label", `${actionButton.textContent} ${documentItem.name}`);
    if (documentItem.status === "missing") actionButton.addEventListener("click", () => openUploadModal(documentItem));
    else actionButton.addEventListener("click", () => showPrototypeMessage(actionButton, "Viewed"));
    item.appendChild(actionButton);

    requiredDocumentList.appendChild(item);
  });
}

function renderDocuments() {
  renderDocumentSummary();
  renderRequiredDocuments();
  renderTaxYears();
  renderDocumentHistory();
}

function renderTaxYears() {
  taxYearToggle.innerHTML = "";
  documentYears.forEach((year) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = year;
    button.classList.toggle("active", year === activeDocumentYear);
    button.setAttribute("aria-pressed", year === activeDocumentYear);
    button.addEventListener("click", () => {
      activeDocumentYear = year;
      if (recentDocumentYears.includes(year)) documentYears = [...recentDocumentYears];
      renderDocuments();
    });
    taxYearToggle.appendChild(button);
  });

  const moreButton = document.createElement("button");
  moreButton.type = "button";
  moreButton.className = "more-years-button";
  moreButton.textContent = "More ▼";
  moreButton.setAttribute("aria-haspopup", "menu");
  moreButton.setAttribute("aria-expanded", "false");

  const menu = document.createElement("div");
  menu.className = "more-years-menu";
  menu.setAttribute("role", "menu");
  menu.hidden = true;

  olderDocumentYears.forEach((year) => {
    const option = document.createElement("button");
    option.type = "button";
    option.textContent = year;
    option.setAttribute("role", "menuitem");
    option.classList.toggle("active", year === activeDocumentYear);
    option.addEventListener("click", (event) => {
      event.stopPropagation();
      activeDocumentYear = year;
      documentYears = [...recentDocumentYears.slice(0, 3), year];
      renderDocuments();
    });
    menu.appendChild(option);
  });

  moreButton.addEventListener("click", (event) => {
    event.stopPropagation();
    menu.hidden = !menu.hidden;
    moreButton.setAttribute("aria-expanded", !menu.hidden);
  });
  taxYearToggle.append(moreButton, menu);
}

function renderDocumentHistory() {
  documentHistory.innerHTML = "";
  documentYears.forEach((year) => {
    const details = document.createElement("details");
    details.className = "history-year-card";
    const summary = document.createElement("summary");
    summary.innerHTML = `<strong>${year}</strong><span>View documents</span>`;
    const list = document.createElement("ul");
    list.className = "history-file-list";
    historicalFiles.forEach((file) => {
      const item = document.createElement("li");
      item.innerHTML = `<span>${file}</span>`;
      const actions = document.createElement("div");
      ["View", "Download"].forEach((label) => {
        const button = document.createElement("button");
        button.type = "button"; button.className = "file-action"; button.textContent = label;
        button.addEventListener("click", () => showPrototypeMessage(button, label === "View" ? "Viewed" : "Downloaded"));
        actions.appendChild(button);
      });
      item.appendChild(actions); list.appendChild(item);
    });
    details.append(summary, list); documentHistory.appendChild(details);
  });
}

function showPrototypeMessage(button, label) {
  const original = button.textContent;
  button.textContent = label;
  window.setTimeout(() => { button.textContent = original; }, 1200);
}

function loadSavedTodoItems() {
  try {
    const savedItems = JSON.parse(localStorage.getItem(TODO_LIST_STORAGE_KEY));
    return Array.isArray(savedItems) ? savedItems : [];
  } catch (error) {
    localStorage.removeItem(TODO_LIST_STORAGE_KEY);
    return [];
  }
}

function saveTodoItems(todoItems) {
  localStorage.setItem(TODO_LIST_STORAGE_KEY, JSON.stringify(todoItems));
}

function syncChecklistSelections(todoItems) {
  try {
    const checklistState = JSON.parse(localStorage.getItem(CHECKLIST_STORAGE_KEY));

    if (!checklistState || !Array.isArray(checklistState.selectedItems) || !Array.isArray(checklistState.completedItems)) {
      return;
    }

    checklistState.selectedItems = todoItems.map((item) => item.id);
    checklistState.completedItems = [];
    checklistState.mode = "selection";

    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checklistState));
  } catch (error) {
    localStorage.removeItem(CHECKLIST_STORAGE_KEY);
  }
}

function updateTodoSummary(todoItems) {
  const totalTasks = todoItems.length;
  const completedTasks = todoItems.filter((item) => item.completed).length;
  const remainingTasks = Math.max(totalTasks - completedTasks, 0);

  todoProgressSummary.textContent = `${completedTasks} of ${totalTasks}`;
  todoRemainingSummary.textContent = remainingTasks === 1 ? "1 remaining" : `${remainingTasks} remaining`;
}

function renderTodoList() {
  const todoItems = loadSavedTodoItems();
  todoListItems.innerHTML = "";

  if (todoItems.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "checklist-empty-state";
    emptyItem.textContent = "No saved checklist tasks yet. Save changes from the Checklist page to add tasks here.";
    todoListItems.appendChild(emptyItem);
    updateTodoSummary(todoItems);
    return;
  }

  todoItems.forEach((item, index) => {
    const listItem = document.createElement("li");
    listItem.className = "task-checklist-item";

    const checkbox = document.createElement("input");
    checkbox.className = "checklist-checkbox";
    checkbox.type = "checkbox";
    checkbox.id = `todo-item-${index}`;
    checkbox.checked = Boolean(item.completed);
    checkbox.addEventListener("change", () => {
      if (!checkbox.checked) {
        item.completed = false;
        saveTodoItems(todoItems);
        updateTodoSummary(todoItems);
        return;
      }

      pendingTodoRemoval = {
        itemId: item.id,
        checkbox
      };

      if (typeof taskConfirmationModal.showModal === "function") {
        taskConfirmationModal.showModal();
      } else {
        taskConfirmationModal.setAttribute("open", "");
      }
    });

    const copyWrap = document.createElement("label");
    copyWrap.className = "task-checklist-copy";
    copyWrap.setAttribute("for", checkbox.id);

    const title = document.createElement("strong");
    title.textContent = item.label;

    const context = document.createElement("span");
    context.className = "task-context";
    context.textContent = item.subgroup ? `${item.group} • ${item.subgroup}` : item.group;

    const link = document.createElement("a");
    link.className = "task-link";
    link.href = "#";
    link.textContent = "Open task link";
    link.addEventListener("click", (event) => {
      event.preventDefault();
    });

    copyWrap.append(title, context, link);
    listItem.append(checkbox, copyWrap);
    todoListItems.appendChild(listItem);
  });

  updateTodoSummary(todoItems);
}

function renderExperienceSetup() {
  experienceSetupContent.innerHTML = "";

  if (experienceSetupComplete) {
    const summary = document.createElement("div");
    summary.className = "experience-summary";
    summary.innerHTML = "<h3>Preferences saved</h3><p>Your filing experience is ready.</p>";

    const list = document.createElement("dl");
    list.className = "preference-summary-list";
    experienceQuestions.forEach((question) => {
      const row = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = question.label;
      const answer = experienceAnswers[question.key];
      description.textContent = Array.isArray(answer) ? answer.join(", ") : answer;
      row.append(term, description);
      list.appendChild(row);
    });

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "secondary-button edit-preferences";
    editButton.textContent = "Edit preferences";
    editButton.addEventListener("click", () => {
      activeExperienceQuestion = 0;
      experienceSetupComplete = false;
      renderExperienceSetup();
    });
    const doneButton = document.createElement("button");
    doneButton.type = "button";
    doneButton.className = "primary-button";
    doneButton.textContent = "Done";
    doneButton.addEventListener("click", collapseExperienceSetup);
    const summaryActions = document.createElement("div");
    summaryActions.className = "experience-controls";
    summaryActions.append(editButton, doneButton);
    summary.append(list, summaryActions);
    experienceSetupContent.appendChild(summary);
    return;
  }

  const question = experienceQuestions[activeExperienceQuestion];
  const questionCard = document.createElement("div");
  questionCard.className = "experience-question";
  const title = document.createElement("h3");
  title.textContent = question.question;
  const type = document.createElement("p");
  type.className = "experience-question-type";
  type.textContent = question.multiple ? "Select all that apply" : "Select one";
  const options = document.createElement("div");
  options.className = "experience-options";

  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "experience-option";
    const currentAnswer = experienceAnswers[question.key];
    const selected = question.multiple ? (currentAnswer || []).includes(option) : currentAnswer === option;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", selected);
    button.textContent = option;
    button.addEventListener("click", () => {
      if (question.multiple) {
        const answers = experienceAnswers[question.key] || [];
        experienceAnswers[question.key] = answers.includes(option)
          ? answers.filter((answer) => answer !== option)
          : [...answers, option];
      } else {
        experienceAnswers[question.key] = option;
      }
      renderExperienceSetup();
    });
    options.appendChild(button);
  });

  const controls = document.createElement("div");
  controls.className = "experience-controls";
  const back = document.createElement("button");
  back.type = "button";
  back.className = "secondary-button";
  back.textContent = "Back";
  back.disabled = activeExperienceQuestion === 0;
  back.addEventListener("click", () => { activeExperienceQuestion -= 1; renderExperienceSetup(); });
  const next = document.createElement("button");
  next.type = "button";
  next.className = "primary-button";
  next.textContent = activeExperienceQuestion === experienceQuestions.length - 1 ? "Save preferences" : "Continue";
  const answer = experienceAnswers[question.key];
  next.disabled = !answer || (Array.isArray(answer) && answer.length === 0);
  next.addEventListener("click", () => {
    if (activeExperienceQuestion === experienceQuestions.length - 1) experienceSetupComplete = true;
    else activeExperienceQuestion += 1;
    renderExperienceSetup();
  });
  controls.append(back, next);

  const dots = document.createElement("div");
  dots.className = "experience-dots";
  dots.setAttribute("aria-label", "Setup progress");
  experienceQuestions.forEach((dotQuestion, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "experience-dot";
    dot.classList.toggle("active", index === activeExperienceQuestion);
    dot.disabled = index > activeExperienceQuestion;
    dot.setAttribute("aria-label", `Question ${index + 1}: ${dotQuestion.question}`);
    dot.addEventListener("click", () => { activeExperienceQuestion = index; renderExperienceSetup(); });
    dots.appendChild(dot);
  });

  questionCard.append(title, type, options, controls, dots);
  experienceSetupContent.appendChild(questionCard);
}

function expandExperienceSetup() {
  experienceSetup.hidden = false;
  experiencePreferencesToggle.setAttribute("aria-expanded", "true");
  renderExperienceSetup();
}

function collapseExperienceSetup() {
  experienceSetup.hidden = true;
  experiencePreferencesToggle.setAttribute("aria-expanded", "false");
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

function getSectionFromHash() {
  if (window.location.hash === "#todo-list") {
    return "To-do List";
  }

  if (window.location.hash === "#message") {
    return "Message";
  }

  if (window.location.hash === "#documents") {
    return "Document";
  }

  return "Dashboard";
}

function showPage(sectionName, updateHash = true) {
  const visibleSection = sectionName === "Document"
    ? "Document"
    : sectionName === "To-do List"
      ? "To-do List"
      : sectionName === "Message"
        ? "Message"
        : "Dashboard";

  if (updateHash) {
    const nextHash = visibleSection === "To-do List"
      ? "#todo-list"
      : visibleSection === "Message"
        ? "#message"
      : visibleSection === "Document"
        ? "#documents"
        : "";

    if (window.location.hash !== nextHash) {
      if (nextHash) {
        window.location.hash = nextHash;
      } else {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
  }

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
  } else if (visibleSection === "To-do List") {
    renderTodoList();
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

function closeTaskConfirmationModal() {
  if (typeof taskConfirmationModal.close === "function") {
    taskConfirmationModal.close();
  } else {
    taskConfirmationModal.removeAttribute("open");
  }
}

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    showPage(item.dataset.section);
  });
});

window.addEventListener("hashchange", () => {
  showPage(getSectionFromHash(), false);
});

taxTipsShortcut.addEventListener("click", () => {
  personalizedRecommendations.scrollIntoView({ behavior: "smooth", block: "start" });
});

experiencePreferencesToggle.addEventListener("click", () => {
  if (experienceSetup.hidden) expandExperienceSetup();
  else collapseExperienceSetup();
});

closeExperienceSetup.addEventListener("click", collapseExperienceSetup);

scenarioButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilingScenario = button.dataset.scenario;
    renderFilingScenario();
  });
});

documentModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeDocumentMode = button.dataset.documentMode;
    documentModeButtons.forEach((modeButton) => {
      const active = modeButton.dataset.documentMode === activeDocumentMode;
      modeButton.classList.toggle("active", active);
      modeButton.setAttribute("aria-pressed", active);
    });
    uploadDocumentsPanel.hidden = activeDocumentMode !== "upload";
    browseDocumentsPanel.hidden = activeDocumentMode !== "browse";
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
  const moreYearsMenu = document.querySelector(".more-years-menu");
  const moreYearsButton = document.querySelector(".more-years-button");
  if (moreYearsMenu) moreYearsMenu.hidden = true;
  if (moreYearsButton) moreYearsButton.setAttribute("aria-expanded", "false");
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

cancelTaskCompletionButton.addEventListener("click", () => {
  if (pendingTodoRemoval?.checkbox) {
    pendingTodoRemoval.checkbox.checked = false;
  }

  pendingTodoRemoval = null;
  closeTaskConfirmationModal();
});

confirmTaskCompletionButton.addEventListener("click", () => {
  if (!pendingTodoRemoval) {
    closeTaskConfirmationModal();
    return;
  }

  const todoItems = loadSavedTodoItems().filter((item) => item.id !== pendingTodoRemoval.itemId);
  saveTodoItems(todoItems);
  syncChecklistSelections(todoItems);
  pendingTodoRemoval = null;
  closeTaskConfirmationModal();
  renderTodoList();
});

uploadModal.addEventListener("close", () => {
  pendingUploadDocument = null;
});

taskConfirmationModal.addEventListener("close", () => {
  if (pendingTodoRemoval?.checkbox) {
    pendingTodoRemoval.checkbox.checked = false;
  }

  pendingTodoRemoval = null;
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
renderExperienceSetup();
renderFilingScenario();
renderDocuments();
renderTodoList();
showPage(getSectionFromHash(), false);
updateCarousel();
startCarousel();
updateRewards();
