document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear activity select to avoid duplicated options on refresh
      activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML
        const participantsListHtml =
          details.participants && details.participants.length > 0
            ? details.participants.map((p) => `<li>${p} <button class='delete-btn' data-participant='${p}' data-activity='${name}' aria-label='Remove ${p}'>🗑️</button></li>`).join("")
            : `<li class="no-participants">No participants yet</li>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants-section">
            <strong>Participants:</strong>
            <ul class="participants-list">
              ${participantsListHtml}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();

        // Optimistically add the participant to the DOM so the user sees the change immediately
        const activityCards = Array.from(activitiesList.querySelectorAll('.activity-card'));
        const activityCard = activityCards.find((c) => c.querySelector('h4') && c.querySelector('h4').textContent === activity);
        if (activityCard) {
          const participantsUl = activityCard.querySelector('.participants-list');
          const noPart = participantsUl.querySelector('.no-participants');
          if (noPart) noPart.remove();
          const li = document.createElement('li');
          li.innerHTML = `${email} <button class='delete-btn' data-participant='${email}' data-activity='${activity}'>🗑️</button>`;
          participantsUl.appendChild(li);

          // Decrement availability display
          const availabilityP = Array.from(activityCard.querySelectorAll('p')).find(p => p.innerHTML.includes('Availability:'));
          if (availabilityP) {
            const match = availabilityP.textContent.match(/(\d+) spots left/);
            if (match) {
              const newSpots = Number(match[1]) - 1;
              availabilityP.innerHTML = `<strong>Availability:</strong> ${newSpots} spots left`;
            }
          }
        }

        // Fetch latest activities to ensure UI stays in sync with the server
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
