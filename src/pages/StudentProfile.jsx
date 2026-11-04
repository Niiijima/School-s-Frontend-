import React, { useState, useEffect } from "react";
import { User, BookOpen, Calendar, Award, Phone, MapPin, AlertCircle, BarChart2, Loader2 } from "lucide-react";

export default function StudentProfile({ studentId = "6ae7cc6eeeb93169ac649638" }) {
  const [activeTab, setActiveTab] = useState("academics");
  const [activeTerm, setActiveTerm] = useState("First Term");
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStudentData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:2000/api/students/${studentId}/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch student profile");

        setProfileData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px", color: "#64748b", fontFamily: "'Quicksand', sans-serif" }}>
        <Loader2 className="animate-spin" size={40} style={{ margin: "0 auto 15px auto" }} />
        <p style={{ fontWeight: "600" }}>Loading student profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "30px", maxWidth: "600px", margin: "40px auto", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "8px", fontFamily: "'Quicksand', sans-serif" }}>
        <h3 style={{ margin: "0 0 10px 0" }}>Connection Error</h3>
        <p style={{ margin: 0 }}>Could not load student data: {error}</p>
      </div>
    );
  }

  // Maps your backend student structure
  const student = profileData?.student || {
    id: "6ae7cc6eeeb93169ac649638",
    name: "Chinedu Okoro",
    admissionNumber: "SCH2025002",
    currentClass: "JSS2 A",
    gender: "Male"
  };

  // Profile image resolution (checks all common field variations from backend)
  const userPhoto = student.profileImage || student.profilePic || student.image || student.photo || student.avatar;

  const termsData = profileData?.terms || {};
  const currentScores = termsData[activeTerm] || [];
  const hasScores = currentScores.length > 0;

  return (
    <div style={{ padding: "30px 20px", maxWidth: "1200px", margin: "0 auto", fontFamily: "'Quicksand', sans-serif", color: "#0f172a" }}>
      
      {/* 1. PERSONAL DETAILS HEADER */}
      <div style={{ backgroundColor: "#0f172a", color: "#ffffff", borderRadius: "12px", padding: "30px", marginBottom: "25px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", gap: "25px", alignItems: "center", flexWrap: "wrap" }}>
          
          {/* Profile Photo / Initials Fallback */}
          <div style={{ width: "95px", height: "95px", borderRadius: "50%", backgroundColor: "#d4af37", display: "flex", alignItems: "center", justifyContent: "center", color: "#0f172a", fontWeight: "bold", fontSize: "2.2rem", overflow: "hidden", border: "3px solid #f8fafc" }}>
            {userPhoto ? (
              <img src={userPhoto} alt={student.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              student.name ? student.name.charAt(0) : <User size={40} />
            )}
          </div>

          <div style={{ flex: "1" }}>
            <span style={{ backgroundColor: "#d4af37", color: "#0f172a", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>
              STUDENT PROFILE
            </span>
            <h1 style={{ margin: "10px 0 6px 0", fontSize: "2rem", color: "#ffffff" }}>{student.name}</h1>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.95rem", display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <span>Admission No: <strong style={{ color: "#fff" }}>{student.admissionNumber}</strong></span>
              <span>Class: <strong style={{ color: "#fff" }}>{student.currentClass}</strong></span>
              <span>Gender: <strong style={{ color: "#fff" }}>{student.gender}</strong></span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid #e2e8f0", marginBottom: "25px", gap: "25px" }}>
        {[
          { key: "academics", label: "Academic Performance", icon: BookOpen },
          { key: "overview", label: "Full Personal Details", icon: User },
          { key: "attendance", label: "Attendance Record", icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 4px",
                border: "none",
                background: "none",
                fontWeight: "700",
                fontSize: "0.95rem",
                cursor: "pointer",
                color: isActive ? "#0f172a" : "#64748b",
                borderBottom: isActive ? "3px solid #0f172a" : "3px solid transparent",
                marginBottom: "-2px"
              }}
            >
              <Icon size={18} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ACADEMICS & TERM RESULT BUTTONS */}
      {activeTab === "academics" && (
        <div>
          {/* Term Toggle Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
            <h3 style={{ margin: 0, color: "#0f172a" }}>Term Results</h3>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {[
                { id: "First Term", label: "First Term Result" },
                { id: "Second Term", label: "Second Term Result" },
                { id: "Third Term", label: "Third Term / Annual Report" },
              ].map((termBtn) => {
                const isActive = activeTerm === termBtn.id;
                return (
                  <button
                    key={termBtn.id}
                    onClick={() => setActiveTerm(termBtn.id)}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      border: isActive ? "2px solid #0f172a" : "1px solid #cbd5e1",
                      backgroundColor: isActive ? "#0f172a" : "#ffffff",
                      color: isActive ? "#ffffff" : "#475569",
                      boxShadow: isActive ? "0 4px 6px -1px rgba(0,0,0,0.1)" : "none",
                      transition: "all 0.2s ease-in-out"
                    }}
                  >
                    {termBtn.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Table or "Yet to be uploaded" */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "25px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", marginBottom: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h4 style={{ margin: 0, color: "#0f172a" }}>{activeTerm} Breakdown</h4>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                {hasScores ? `${currentScores.length} Subjects Recorded` : "Status: Pending"}
              </span>
            </div>

            {hasScores ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#334155" }}>
                      <th style={{ padding: "12px" }}>Subject</th>
                      <th style={{ padding: "12px" }}>CA (40)</th>
                      <th style={{ padding: "12px" }}>Exam (60)</th>
                      <th style={{ padding: "12px" }}>Total (100)</th>
                      
                      {activeTerm === "Second Term" && (
                        <th style={{ padding: "12px", color: "#b45309", backgroundColor: "#fffbeb" }}>Cumulative (1st + 2nd)</th>
                      )}
                      {activeTerm === "Third Term" && (
                        <th style={{ padding: "12px", color: "#b45309", backgroundColor: "#fffbeb" }}>Annual Cumulative</th>
                      )}

                      <th style={{ padding: "12px" }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentScores.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px", fontWeight: "700" }}>{row.subject}</td>
                        <td style={{ padding: "12px" }}>{row.ca}</td>
                        <td style={{ padding: "12px" }}>{row.exam}</td>
                        <td style={{ padding: "12px", fontWeight: "700" }}>{row.total}</td>

                        {activeTerm === "Second Term" && (
                          <td style={{ padding: "12px", fontWeight: "700", color: "#b45309", backgroundColor: "#fffbeb" }}>
                            {row.cumulative ?? "-"}%
                          </td>
                        )}
                        {activeTerm === "Third Term" && (
                          <td style={{ padding: "12px", fontWeight: "700", color: "#b45309", backgroundColor: "#fffbeb" }}>
                            {row.annualCumulative ?? "-"}%
                          </td>
                        )}

                        <td style={{ padding: "12px" }}>
                          <span style={{ padding: "4px 8px", backgroundColor: "#f1f5f9", borderRadius: "4px", fontWeight: "bold" }}>
                            {row.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                <AlertCircle size={40} color="#cbd5e1" style={{ margin: "0 auto 10px auto" }} />
                <h4 style={{ margin: "0 0 5px 0", color: "#334155" }}>Yet to be uploaded</h4>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>Results for {activeTerm} have not been published by the administration yet.</p>
              </div>
            )}
          </div>

          {/* PERFORMANCE GRAPH / TREND SUMMARY */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "25px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
              <BarChart2 size={22} color="#0f172a" />
              <h3 style={{ margin: 0, color: "#0f172a" }}>Academic Performance Trend</h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginTop: "20px" }}>
              <div style={{ padding: "15px", backgroundColor: "#f8fafc", borderRadius: "8px", borderLeft: "4px solid #0f172a" }}>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>First Term Average</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a", marginTop: "5px" }}>
                  {profileData?.performanceTrend?.firstTermAvg ?? "N/A"}
                </div>
              </div>
              <div style={{ padding: "15px", backgroundColor: "#fffbeb", borderRadius: "8px", borderLeft: "4px solid #d4af37" }}>
                <div style={{ fontSize: "0.85rem", color: "#b45309" }}>Second Term Cumulative</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#b45309", marginTop: "5px" }}>
                  {profileData?.performanceTrend?.secondTermAvg ?? "N/A"}
                </div>
              </div>
              <div style={{ padding: "15px", backgroundColor: "#f8fafc", borderRadius: "8px", borderLeft: "4px solid #94a3b8" }}>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Third Term / Annual</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#64748b", marginTop: "5px" }}>
                  {profileData?.performanceTrend?.thirdTermAvg ?? "Pending"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FULL PERSONAL DETAILS */}
      {activeTab === "overview" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "25px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 20px 0", color: "#0f172a" }}>Detailed Student Information</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "25px" }}>
            <div>
              <p style={{ color: "#64748b", margin: "0 0 4px 0", fontSize: "0.85rem" }}>Full Name</p>
              <p style={{ fontWeight: "600", margin: 0, fontSize: "1rem" }}>{student.name}</p>
            </div>
            <div>
              <p style={{ color: "#64748b", margin: "0 0 4px 0", fontSize: "0.85rem" }}>Admission Number</p>
              <p style={{ fontWeight: "600", margin: 0, fontSize: "1rem" }}>{student.admissionNumber}</p>
            </div>
            <div>
              <p style={{ color: "#64748b", margin: "0 0 4px 0", fontSize: "0.85rem" }}>Current Class</p>
              <p style={{ fontWeight: "600", margin: 0, fontSize: "1rem" }}>{student.currentClass}</p>
            </div>
            <div>
              <p style={{ color: "#64748b", margin: "0 0 4px 0", fontSize: "0.85rem" }}>Gender</p>
              <p style={{ fontWeight: "600", margin: 0, fontSize: "1rem" }}>{student.gender}</p>
            </div>
            <div>
              <p style={{ color: "#64748b", margin: "0 0 4px 0", fontSize: "0.85rem" }}>Residential Address</p>
              <p style={{ fontWeight: "600", margin: 0, fontSize: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={16} color="#64748b" /> {student.address || "Not specified"}
              </p>
            </div>
            <div>
              <p style={{ color: "#64748b", margin: "0 0 4px 0", fontSize: "0.85rem" }}>Guardian Phone Number</p>
              <p style={{ fontWeight: "600", margin: 0, fontSize: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <Phone size={16} color="#64748b" /> {student.guardianPhone || student.phone || "Not specified"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE */}
      {activeTab === "attendance" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "40px", border: "1px solid #e2e8f0", textAlign: "center" }}>
          <Calendar size={40} color="#0f172a" style={{ margin: "0 auto 15px auto" }} />
          <h3 style={{ margin: "0 0 10px 0", color: "#0f172a" }}>Attendance Tracking Module</h3>
          <p style={{ color: "#64748b", maxWidth: "500px", margin: "0 auto 20px auto" }}>
            The attendance records and daily register integration are currently queued for upcoming implementation.
          </p>
          <span style={{ backgroundColor: "#f1f5f9", color: "#475569", padding: "6px 14px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "bold" }}>
            Coming Soon
          </span>
        </div>
      )}

    </div>
  );
}