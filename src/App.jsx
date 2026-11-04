import React, { useState, useEffect } from "react";
import schoolLogo from "./assets/logo.jpeg";

import slide1 from "./assets/1.jpeg";
import slide2 from "./assets/2.jpeg";
import slide3 from "./assets/3.jpeg";
import slide4 from "./assets/4.jpeg";
import slide5 from "./assets/5.jpeg";
import slide6 from "./assets/6.jpeg";
import slide7 from "./assets/7.jpeg";
import slide8 from "./assets/8.jpeg";
import slide10 from "./assets/10.jpeg";
import slide11 from "./assets/11.jpeg";
import founderPhoto from "./assets/PT.jpeg";

import { 
  Menu, 
  X, 
  BookOpen, 
  Palette, 
  Users, 
  MapPin, 
  Clock, 
  Trash2,
  Phone,
  Mail,
  UserCheck,
  Lock
} from "lucide-react";
import "./App.css";

const INITIAL_EVENTS = [
  {
    id: 1,
    day: "15",
    month: "OCT",
    title: "Inter-House Sports Competition",
    location: "School Main Field",
    time: "9:00 AM",
    description: "Join us for an exciting day of athletic track and field events as our houses compete for the championship trophy."
  },
  {
    id: 2,
    day: "28",
    month: "OCT",
    title: "Annual Science & Art Exhibition",
    location: "School Auditorium",
    time: "10:00 AM",
    description: "Discover innovative student projects, practical experiments, and impressive creative artworks on display."
  },
  {
    id: 3,
    day: "12",
    month: "NOV",
    title: "Parents-Teachers Association (PTA) Meeting",
    location: "Multi-Purpose Hall",
    time: "11:00 AM",
    description: "An important interactive session to discuss student progress, upcoming term activities, and school growth."
  }
];

// Removed founderPhoto / PT.jpeg from the slideshow list
const SLIDES = [
  { id: 1, src: slide1, alt: "O'lak Triumph School Activity 1" },
  { id: 2, src: slide2, alt: "O'lak Triumph School Activity 2" },
  { id: 3, src: slide3, alt: "O'lak Triumph School Activity 3" },
  { id: 4, src: slide4, alt: "O'lak Triumph School Activity 4" },
  { id: 5, src: slide5, alt: "O'lak Triumph School Activity 5" },
  { id: 6, src: slide6, alt: "O'lak Triumph School Activity 6" },
  { id: 7, src: slide7, alt: "O'lak Triumph School Activity 7" },
  { id: 8, src: slide8, alt: "O'lak Triumph School Activity 8" },
  { id: 10, src: slide10, alt: "O'lak Triumph School Activity 10" },
  { id: 11, src: slide11, alt: "O'lak Triumph School Activity 11" }
];

export default function App() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem("olak_events");
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [loginError, setLoginError] = useState("");

  const [newEvent, setNewEvent] = useState({
    title: "",
    day: "",
    month: "OCT",
    location: "",
    time: "",
    description: ""
  });

  useEffect(() => {
    const fontLink = document.createElement("link");
    fontLink.href = "https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Fredoka:wght@500;600;700&family=Quicksand:wght@600;700&display=swap";
    fontLink.rel = "stylesheet";
    document.head.appendChild(fontLink);
  }, []);

  useEffect(() => {
    localStorage.setItem("olak_events", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminUser === "admin" && adminPass === "olaktriumph2026") {
      setIsAdminLoggedIn(true);
      setLoginError("");
      setAdminUser("");
      setAdminPass("");
    } else {
      setLoginError("Invalid username or password.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.day) return;
    setEvents([{ ...newEvent, id: Date.now() }, ...events]);
    setNewEvent({ title: "", day: "", month: "OCT", location: "", time: "", description: "" });
    setIsModalOpen(false);
  };

  const handleDeleteEvent = (id) => {
    if (!isAdminLoggedIn) {
      setIsModalOpen(true);
      return;
    }
    setEvents(events.filter((item) => item.id !== id));
  };

  return (
    <div className="app">
      <div className="top-bar">
        <div className="container top-bar-inner">
          <div className="top-info">
            <span><MapPin size={14} /> 12 Oseni Shotonwa Street, Ebute, Ikorodu, Lagos</span>
            <span><Phone size={14} /> <a href="tel:+2348086748855">+234 8086748855</a></span>
            <span><Mail size={14} /> <a href="mailto:olaktriumphschool@gmail.com">olaktriumphschool@gmail.com</a></span>
          </div>
          <div className="top-actions">
            <a href="#student-portal" className="portal-link"><UserCheck size={14} /> Student Portal</a>
            {isAdminLoggedIn ? (
              <button 
                onClick={handleAdminLogout} 
                className="portal-link" 
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--secondary)", fontWeight: "bold" }}
              >
                 Admin Active (Logout)
              </button>
            ) : (
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="portal-link"
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
              >
                Admin Login
              </button>
            )}
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <a href="#" className="logo">
            <img src={schoolLogo} alt="O'lak Triumph School Logo" className="header-logo-img" />
            <span>O'lak Triumph School</span>
          </a>

          <nav className={`main-nav ${isNavOpen ? "open" : ""}`}>
            <a href="#" onClick={() => setIsNavOpen(false)} className="active">Home</a>
            <a href="#founder" onClick={() => setIsNavOpen(false)}>Meet the Founder</a>
            <a href="#events" onClick={() => setIsNavOpen(false)}>Upcoming Events</a>
            <a href="#contact" onClick={() => setIsNavOpen(false)}>Contact Us</a>
          </nav>

          <button className="menu-toggle" onClick={() => setIsNavOpen(!isNavOpen)} aria-label="Toggle Navigation Menu">
            {isNavOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <main>
        <section className="hero hero-slider-container">
          <div className="hero-slides-wrapper">
            {SLIDES.map((slide, index) => (
              <div
                key={slide.id}
                className={`hero-slide ${index === currentSlide ? "active" : ""}`}
                style={{
                  backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), url(${slide.src})`
                }}
              />
            ))}
          </div>

          <div className="container hero-content">
            <h1 className="hero-title">
              <span>Welcome to O'lak Triumph School</span>
            </h1>
            <p className="hero-motto">Committed to Excellence in Education</p>
            <p className="hero-desc">
              O'lak Triumph School is a vibrant learning community dedicated to nurturing curious minds and responsible citizens in Ikorodu, Lagos.
            </p>
            <div className="hero-actions">
              <a href="#founder" className="btn btn-primary">Learn More</a>
              <a href="#events" className="btn btn-secondary">Upcoming Events</a>
            </div>
          </div>
        </section>

        <section className="stats">
          <div className="container stats-grid">
            <div className="stat-card"><div className="stat-number">2003</div><div>Founded</div></div>
            <div className="stat-card"><div className="stat-number">100+</div><div>Students</div></div>
            <div className="stat-card"><div className="stat-number">25+</div><div>Teachers</div></div>
            <div className="stat-card"><div className="stat-number">Primary & Secondary</div><div>Classes</div></div>
          </div>
        </section>

        {/* Founder section keeps founderPhoto (PT.jpeg) exclusively */}
        <section className="founder-section" id="founder">
          <div className="container founder-grid">
            <div className="founder-image-wrapper">
              <img src={founderPhoto} alt="Founder of O'lak Triumph School" />
            </div>
            <div className="founder-content">
              <span className="section-badge" style={{ fontFamily: "'Fredoka', cursive, sans-serif" }}>
                LEADERSHIP
              </span>
              <h2>Meet Our Founder</h2>
              <p 
                className="founder-quote" 
                style={{ fontFamily: "'Fredoka', cursive, sans-serif", fontSize: "1.3rem", lineHeight: "1.6", color: "#0f172a" }}
              >
                "Education is not merely about academic performance, but about building character, confidence, and purpose in every young learner."
              </p>
              <p 
                className="founder-text" 
                style={{ fontFamily: "'Fredoka', cursive, sans-serif", fontSize: "1.15rem", lineHeight: "1.7", color: "#334155" }}
              >
                Founded in 2003, <strong>O'lak Triumph School</strong> was established with a vision to build a holistic educational institution that fosters both academic distinction and moral leadership.
              </p>
            </div>
          </div>
        </section>

        <section className="highlights">
          <div className="container">
            <h2 className="section-title">Why Choose O'lak Triumph School?</h2>
            <div className="cards">
              <div className="card card-theme-navy">
                <div className="card-icon-wrapper">
                  <BookOpen size={28} strokeWidth={2.2} />
                </div>
                <h3 className="card-title">Strong Academics</h3>
                <p className="card-text">A comprehensive curriculum tailored to empower students with foundational knowledge.</p>
              </div>

              <div className="card card-theme-gold">
                <div className="card-icon-wrapper">
                  <Palette size={28} strokeWidth={2.2} />
                </div>
                <h3 className="card-title">Arts &amp; Craft</h3>
                <p className="card-text">Thriving creative programs that encourage self-expression and practical talent development.</p>
              </div>

              <div className="card card-theme-teal">
                <div className="card-icon-wrapper">
                  <Users size={28} strokeWidth={2.2} />
                </div>
                <h3 className="card-title">Community</h3>
                <p className="card-text">A supportive environment where every student is known, valued, and encouraged.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="upcoming-events" id="events">
          <div className="container">
            <div className="events-header">
              <div>
                <h2 className="section-title">Upcoming School Events</h2>
                <p>Stay updated with our key activities and schedules.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                <Lock size={16} style={{ marginRight: "6px" }} /> {isAdminLoggedIn ? "Add Event" : "Add Event (Admin)"}
              </button>
            </div>

            <div className="events-grid">
              {events.map((event) => (
                <div className="event-card" key={event.id}>
                  <div className="event-date">
                    <span className="day">{event.day}</span>
                    <span className="month">{event.month}</span>
                  </div>
                  <div className="event-details">
                    <div className="event-title-row">
                      <h3>{event.title}</h3>
                      {isAdminLoggedIn && (
                        <button className="btn-delete" onClick={() => handleDeleteEvent(event.id)} title="Delete Event">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <p className="event-meta">
                      <span><MapPin size={14} /> {event.location}</span>
                      <span><Clock size={14} /> {event.time}</span>
                    </p>
                    <p>{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <h3>O'lak Triumph School</h3>
              <p>Committed to Excellence in Education</p>
            </div>
            <div id="contact">
              <h4>Contact Us</h4>
              <p>12 Oseni Shotonwa Street, Ebute, Ikorodu, Lagos</p>
              <p><a href="tel:+2348086748855">+234 8086748855</a></p>
              <p><a href="mailto:olaktriumphschool@gmail.com">olaktriumphschool@gmail.com</a></p>
            </div>
            <div>
              <h4>Activity Highlights</h4>
              <div className="footer-slideshow">
                {SLIDES.map((slide, index) => (
                  <img
                    key={slide.id}
                    src={slide.src}
                    alt={slide.alt}
                    className={`slide ${index === currentSlide ? "active" : ""}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="copyright">&copy; 2003–2026 O'lak Triumph School. All rights reserved.</p>
        </div>
      </footer>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            {!isAdminLoggedIn ? (
              <>
                <div className="modal-header">
                  <h3>Admin Authentication Required</h3>
                  <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                </div>
                <form onSubmit={handleAdminLogin} className="modal-form">
                  <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "10px" }}>
                    Please sign in with administrator credentials to add or manage events. <br/>
                    <small style={{ fontStyle: "italic" }}>(Demo credentials — User: <code>admin</code> | Pass: <code>olaktriumph2026</code>)</small>
                  </p>
                  {loginError && <p style={{ color: "#ef4444", fontSize: "0.85rem", fontWeight: "600" }}>{loginError}</p>}
                  <label>Username: <input type="text" required value={adminUser} onChange={(e) => setAdminUser(e.target.value)} placeholder="Enter admin username" /></label>
                  <label>Password: <input type="password" required value={adminPass} onChange={(e) => setAdminPass(e.target.value)} placeholder="Enter admin password" /></label>
                  
                  <div className="modal-actions" style={{ marginTop: "15px" }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Login as Admin</button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="modal-header">
                  <h3>Add New School Event</h3>
                  <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                </div>
                <form onSubmit={handleAddEvent} className="modal-form">
                  <label>Title: <input type="text" required value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} /></label>
                  <div className="form-row">
                    <label>Day: <input type="text" required placeholder="e.g. 15" value={newEvent.day} onChange={(e) => setNewEvent({ ...newEvent, day: e.target.value })} /></label>
                    <label>Month: 
                      <select value={newEvent.month} onChange={(e) => setNewEvent({ ...newEvent, month: e.target.value })}>
                        {["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="form-row">
                    <label>Location: <input type="text" value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} /></label>
                    <label>Time: <input type="text" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} /></label>
                  </div>
                  <label>Description: <textarea rows="3" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}></textarea></label>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save Event</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}