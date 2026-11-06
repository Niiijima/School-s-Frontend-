import api from "./axios";

export const loginAdmin = async ({ email, password }) => {
  const res = await api.post("/admin/login", { email, password });

  const { token, admin } = res.data;

  if (!token) {
    throw new Error("No token received from server");
  }

  localStorage.setItem("token", token);
  localStorage.setItem("role", "admin");
  localStorage.setItem("user", JSON.stringify(admin || {}));

  return res.data;
};

export const loginStudent = async ({ admissionNumber, password }) => {
  const res = await api.post("/students/login", {
    admissionNumber,
    password,
  });

  const { token, student, user } = res.data;

  if (!token) {
    throw new Error("No token received from server");
  }

  localStorage.setItem("token", token);
  localStorage.setItem("role", "student");
  localStorage.setItem("user", JSON.stringify(student || user || {}));

  return res.data;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
};