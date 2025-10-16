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
      // Clear activity select before repopulating to avoid duplicate options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
  // Hide decorative bullets per user request
  activityCard.classList.add("hide-bullets");

        const spotsLeft = details.max_participants - (details.participants ? details.participants.length : 0);

        // Basic activity info
        const title = document.createElement("h4");
        title.textContent = name;

        const desc = document.createElement("p");
        desc.textContent = details.description;

        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

        const availability = document.createElement("p");
        availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

        // Participants section
        const participantsContainer = document.createElement("div");
        participantsContainer.className = "participants";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsContainer.appendChild(participantsHeading);

        const participants = details.participants || [];

        if (participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participant-list";

          participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant";

            // Determine display name and initials
            let displayName = "";
            if (typeof p === "string") {
              displayName = p.split("@")[0].replace(/\./g, " ");
            } else if (p && typeof p === "object") {
              displayName = p.name || (p.email ? p.email.split("@")[0].replace(/\./g, " ") : "");
            }

            displayName = displayName.trim() || "Participant";

            const initials = displayName
              .split(/\s+/)
              .map((s) => s[0] || "")
              .slice(0, 2)
              .join("")
              .toUpperCase() || displayName.slice(0, 2).toUpperCase();

            const avatarSpan = document.createElement("span");
            avatarSpan.className = "avatar";
            avatarSpan.textContent = initials;

            const info = document.createElement("span");
            info.className = "participant-info";

            const nameSpan = document.createElement("span");
            nameSpan.className = "name";
            // Capitalize words for nicer display
            nameSpan.textContent = displayName.replace(/\b\w/g, (c) => c.toUpperCase());

            info.appendChild(nameSpan);

            if (p && typeof p === "object" && p.joined_at) {
              const metaSpan = document.createElement("span");
              metaSpan.className = "meta";
              metaSpan.textContent = `Joined · ${p.joined_at}`;
              info.appendChild(metaSpan);
            }

            li.appendChild(avatarSpan);
            li.appendChild(info);

            // Delete/unregister button
            const delBtn = document.createElement("button");
            delBtn.className = "participant-delete";
            delBtn.title = "Unregister participant";
            delBtn.setAttribute("aria-label", `Unregister ${displayName}`);
            delBtn.innerHTML = "&times;"; // simple X icon

            // When clicked, call DELETE endpoint to unregister
            delBtn.addEventListener("click", async (e) => {
              e.preventDefault();
              e.stopPropagation();

              // Confirm before deleting
              if (!confirm(`Unregister ${displayName}?`)) return;

              try {
                // The server stores participants as emails (strings); build email if available
                let email = typeof p === "string" ? p : p.email;
                if (!email) {
                  alert("Participant email not available");
                  return;
                }

                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );

                const result = await resp.json();

                if (resp.ok) {
                  // Remove li from DOM
                  li.remove();
                  // Refresh activities to update availability and lists
                  fetchActivities();
                } else {
                  alert(result.detail || "Failed to unregister participant");
                }
              } catch (err) {
                console.error("Error unregistering participant:", err);
                alert("Failed to unregister participant. See console for details.");
              }
            });

            li.appendChild(delBtn);

            // Optional: role/badge if provided
            if (p && typeof p === "object" && p.role) {
              const badge = document.createElement("span");
              badge.className = "badge";
              badge.textContent = p.role;
              li.appendChild(badge);
            }

            ul.appendChild(li);
          });

          participantsContainer.appendChild(ul);
        } else {
          const empty = document.createElement("div");
          empty.className = "empty";
          empty.textContent = "No participants yet";
          participantsContainer.appendChild(empty);
        }

        // Append all pieces to the card
        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(schedule);
        activityCard.appendChild(availability);
        activityCard.appendChild(participantsContainer);

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
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the new participant appears immediately
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
