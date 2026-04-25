const BASE_URL = "/api";

const getToken = () => localStorage.getItem("token") || "";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

async function request(method, path, body = null, isFormData = false) {
  const headers = isFormData
    ? { Authorization: `Bearer ${getToken()}` }
    : getHeaders();

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : null,
    });
  } catch (e) {
    throw new Error("Cannot connect to server. Make sure the backend is running.");
  }

  if (res.status === 302 || res.redirected) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
    throw new Error("Session expired. Please log in again.");
  }

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
    throw new Error("Unauthorized. Please log in.");
  }

  const text = await res.text();

  if (!res.ok) {
    try {
      const j = JSON.parse(text);
      throw new Error(j.error || j.message || `Error ${res.status}`);
    } catch (parseErr) {
      if (parseErr.message.startsWith("Error ") || text) {
        throw new Error(text || `Error ${res.status}`);
      }
      throw parseErr;
    }
  }

  if (!text) return {};
  try { return JSON.parse(text); } catch { return text; }
}

export const authAPI = {
  register: (d) => request("POST", "/auth/register", d),
  login:    (d) => request("POST", "/auth/login", d),
  validate: ()  => request("GET",  "/auth/validate"),
};

export const quizAPI = {
  generate:        (d)  => request("POST", "/quiz/generate", d),
  getUserQuizzes:  (id) => request("GET",  `/quiz/user/${id}`),
  getQuiz:         (id) => request("GET",  `/quiz/${id}`),
  submitAttempt:   (d)  => request("POST", "/quiz/attempt", d),
  getUserAttempts: (id) => request("GET",  `/quiz/attempts/${id}`),
  getStats:        (id) => request("GET",  `/quiz/stats/${id}`),
};

export const materialAPI = {
  upload: (file, userId, subject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("userId", userId);
    form.append("subject", subject);
    return request("POST", "/materials/upload", form, true);
  },
  getUserMaterials: (id) => request("GET",    `/materials/user/${id}`),
  getMaterial:      (id) => request("GET",    `/materials/${id}`),
  deleteMaterial:   (id) => request("DELETE", `/materials/${id}`),
};

export const analyticsAPI = {
  getDashboard:      (id) => request("GET",  `/analytics/dashboard/${id}`),
  getWeeklyTrend:    (id) => request("GET",  `/analytics/trend/${id}`),
  logSession:        (d)  => request("POST", "/analytics/session", d),
  logScore:          (d)  => request("POST", "/analytics/score", d),
  getRecommendation: (id) => request("GET",  `/analytics/recommendation/${id}`).then(r => r?.recommendation || null),
};

export const groupAPI = {
  create:          (d)     => request("POST", "/groups", d),
  join:            (d)     => request("POST", "/groups/join", d),
  getUserGroups:   (id)    => request("GET",  `/groups/user/${id}`),
  getLeaderboard:  (id)    => request("GET",  `/groups/${id}/leaderboard`),
  addXp:           (id, d) => request("POST", `/groups/${id}/xp`, d),
  getChallenges:   (id)    => request("GET",  `/groups/${id}/challenges`),
  createChallenge: (id, d) => request("POST", `/groups/${id}/challenges`, d),
};

export const notificationAPI = {
  sendReminder: (d) => request("POST", "/notifications/reminder", d),
};
