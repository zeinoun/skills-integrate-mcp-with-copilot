document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const loginForm = document.getElementById("login-form");
  const userInfo = document.getElementById("user-info");
  const userName = document.getElementById("user-name");
  const userRole = document.getElementById("user-role");
  const logoutBtn = document.getElementById("logout-btn");
  const signupContainer = document.getElementById("signup-container");
  const unauthenticatedNote = document.getElementById("unauthenticated-note");
  const emailInput = document.getElementById("email");
  const loginEmailInput = document.getElementById("login-email");
  const loginPasswordInput = document.getElementById("login-password");

  let currentUser = null;

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = "<option value=\"\">-- Select an activity --</option>";

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function fetchCurrentUser() {
    try {
      const response = await fetch("/auth/me");
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  }

  function showMessage(text, type = "success") {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function updateUIForUser(user) {
    currentUser = user;
    if (user) {
      loginForm.classList.add("hidden");
      userInfo.classList.remove("hidden");
      signupContainer.classList.remove("hidden");
      unauthenticatedNote.classList.add("hidden");
      userName.textContent = user.name;
      userRole.textContent = `(${user.role})`;
      emailInput.value = user.email;
    } else {
      loginForm.classList.remove("hidden");
      userInfo.classList.add("hidden");
      signupContainer.classList.add("hidden");
      unauthenticatedNote.classList.remove("hidden");
      emailInput.value = "";
    }
  }

  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(
          email
        )}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();
      if (response.ok) {
        showMessage(result.message, "success");
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value;
    const activity = activitySelect.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(
          email
        )}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();
      if (response.ok) {
        showMessage(result.message, "success");
        activitySelect.value = "";
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const loginEmail = loginEmailInput.value;
    const loginPassword = loginPasswordInput.value;

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        updateUIForUser(result);
        showMessage(`Welcome, ${result.name}!`, "success");
      } else {
        showMessage(result.detail || "Failed to log in.", "error");
      }
    } catch (error) {
      showMessage("Login request failed. Please try again.", "error");
      console.error("Error logging in:", error);
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("/auth/logout", {
        method: "POST",
      });
      if (response.ok) {
        updateUIForUser(null);
        showMessage("Logged out successfully", "success");
      } else {
        showMessage("Failed to log out.", "error");
      }
    } catch (error) {
      showMessage("Logout request failed. Please try again.", "error");
      console.error("Error logging out:", error);
    }
  });

  async function initialize() {
    const user = await fetchCurrentUser();
    updateUIForUser(user);
    await fetchActivities();
  }

  initialize();
});
