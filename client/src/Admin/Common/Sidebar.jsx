import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Book,
  CheckSquare,
  File,
  Flag,
  Info,
  RefreshCw,
  Star,
  Users,
  Zap,
} from "react-feather";

function Sidebar({ isOpen }) {
  const [isHovered, setHovered] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showButton, setShowButton] = useState(true);
  const location = useLocation();
  const { pathname } = location;

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    setUserRole(userData.role);
  }, []);

  const handleMouseEnter = () => {
    if (!isOpen) {
      setHovered(true);
      setShowButton(true);
    }
  };
  const handleMouseLeave = () => {
    if (!isOpen) {
      setHovered(false);
      setShowButton(false);
    }
  };

  const isSidebarExpanded = isOpen || isHovered;

  const toggleMenu = (key) => {
    setActiveMenu((prev) => (prev === key ? null : key));
  };

  const isActive = (path) => {
    return pathname === path || pathname.startsWith(path);
  };

  const handleLinkClick = () => {
    const width = window.innerWidth;
    if (width <= 1200) {
      document.body.classList.remove("sidebar-enable");
    }
  };

  useEffect(() => {
    if (pathname.includes("/userlist")) {
      setActiveMenu("providers");
    } else if (
      pathname === "/driverlist" ||
      pathname.startsWith("/tutoriallist") ||
      pathname.startsWith("/addtutorial") ||
      pathname.startsWith("/updatetutorial")
    ) {
      setActiveMenu("seekers");
    } else if (
      pathname === "/sportlist" ||
      pathname.startsWith("/addsport") ||
      pathname.startsWith("/updatesport") ||
      pathname.startsWith("/levellist") ||
      pathname.startsWith("/updatelevel") ||
      pathname.startsWith("/positionlist") ||
      pathname.startsWith("/addposition") ||
      pathname.startsWith("/addlevel") ||
      pathname.startsWith("/updateposition")
    ) {
      setActiveMenu("users");
    } else if (pathname === "/teamlist") {
      setActiveMenu("teamManagement");
    } else if (pathname === "/bookinglist") {
      setActiveMenu("booking");
    } else if (pathname === "/requestlist") {
      setActiveMenu("request");
    } else if (pathname === "/ratinglist") {
      setActiveMenu("rating");
    } else if (pathname === "/matchlist") {
      setActiveMenu("matchs");
    } else if (pathname === "/leaguelist") {
      setActiveMenu("league");
    } else if (
      pathname.includes("/contactlist") ||
      pathname.includes("/faqlist") ||
      pathname.startsWith("/addfaq") ||
      pathname.startsWith("/updatefaq")
    ) {
      setActiveMenu("support");
    } else if (pathname.includes("/password")) {
      setActiveMenu("settings");
    } else {
      setActiveMenu(null);
    }
  }, [pathname]);

  const canAccessRequests = userRole !== "3";

  return (
    <div
      className={`vertical-menu ${isSidebarExpanded ? "hovered" : "collapsed"}`}
      onMouseEnter={() => {
        handleMouseEnter();
        document.body.classList.add("hovered");
      }}
      onMouseLeave={() => {
        handleMouseLeave();
        document.body.classList.remove("hovered");
      }}
    >
      <div className="navbar-brand-box">
        <Link to="/dashboard" className="logo" onClick={handleLinkClick}>
          <span className="logo-lg">
            <img src="/assets/images/Crewed.png" alt="" height={20} />
          </span>
        </Link>
        <button
          type="button"
          className="btn btn-sm hide-menu-btn"
          onClick={() => {
            const body = document.body;
            body.classList.toggle("sidebar-enable");
            body.classList.remove("hovered");
            setHovered(false);
            setShowButton(false);

            if (window.innerWidth >= 1200) {
              body.classList.toggle("vertical-collapsed");
            } else {
              body.classList.remove("vertical-collapsed");
            }
          }}
          style={{
            display: isSidebarExpanded && showButton ? "block" : "none",
          }}
        >
          <i className="fe-x"></i>
        </button>
      </div>
      <div data-simplebar="" className="sidebar-menu-scroll mt-1">
        <div id="sidebar-menu">
          <ul className="metismenu list-unstyled" id="side-menu">
            <li className={isActive("/dashboard") ? "mm-active" : ""}>
              <Link to="/dashboard" onClick={handleLinkClick}>
                <i className="ri-pie-chart-2-fill" />
                <span>Dashboard</span>
              </Link>
            </li>

            

            <li className={activeMenu === "providers" ? "mm-active" : ""}>
              <Link
                className="has-arrow waves-effect"
                onClick={() => toggleMenu("providers")}
              >
                <i className="uil-user-square" />
                <span>Users</span>
              </Link>
              {isSidebarExpanded && activeMenu === "providers" && (
                <ul className="sub-menu mm-show">
                  <li>
                    <Link
                      className={isActive("/userlist") ? "active" : ""}
                      to="/userlist"
                      onClick={handleLinkClick}
                    >
                      User listings
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            <li className={activeMenu === "seekers" ? "mm-active" : ""}>
              <Link
                className="has-arrow waves-effect"
                onClick={() => toggleMenu("seekers")}
              >
                <i className="ri-user-search-line" />
                <span>Drivers</span>
              </Link>
              {isSidebarExpanded && activeMenu === "seekers" && (
                <ul className="sub-menu mm-show">
                  <li>
                    <Link
                      className={isActive("/driverlist") ? "active" : ""}
                      to="/driverlist"
                      onClick={handleLinkClick}
                    >
                      Driver listings
                    </Link>
                  </li>
                  <li>
                    <Link
                      className={isActive("/tutoriallist") ? "active" : ""}
                      to="/tutoriallist"
                      onClick={handleLinkClick}
                    >
                      Tutorial listings
                    </Link>
                  </li>
                </ul>
              )}
            </li>

         

           

            
            
            <li className={activeMenu === "booking" ? "mm-active" : ""}>
              <Link
                className="has-arrow waves-effect"
                onClick={() => toggleMenu("booking")}
              >
                <Book />
                <span>Bookings</span>
              </Link>
              {isSidebarExpanded && activeMenu === "booking" && (
                <ul className="sub-menu mm-show">
                  <li>
                    <Link
                      className={isActive("/bookinglist") ? "active" : ""}
                      to="/bookinglist"
                      onClick={handleLinkClick}
                    >
                      Booking list
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            <li className={activeMenu === "rating" ? "mm-active" : ""}>
              <Link
                className="has-arrow waves-effect"
                onClick={() => toggleMenu("rating")}
              >
                <Star />
                <span>Ratings</span>
              </Link>
              {isSidebarExpanded && activeMenu === "rating" && (
                <ul className="sub-menu mm-show">
                  <li>
                    <Link
                      className={isActive("/ratinglist") ? "active" : ""}
                      to="/ratinglist"
                      onClick={handleLinkClick}
                    >
                      Rating list
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            <li className={activeMenu === "support" ? "mm-active" : ""}>
              <Link
                className="has-arrow waves-effect"
                onClick={() => toggleMenu("support")}
              >
                <i className="ri-customer-service-2-line" />
                <span>Support Center</span>
              </Link>
              {isSidebarExpanded && activeMenu === "support" && (
                <ul className="sub-menu mm-show">
                  <li>
                    <Link
                      className={isActive("/contactlist") ? "active" : ""}
                      to="/contactlist"
                      onClick={handleLinkClick}
                    >
                      Contact List
                    </Link>
                  </li>
                  <li>
                    <Link
                      className={isActive("/faqlist") ? "active" : ""}
                      to="/faqlist"
                      onClick={handleLinkClick}
                    >
                      FAQ's List
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            <li className={activeMenu === "settings" ? "mm-active" : ""}>
              <Link
                className="has-arrow waves-effect"
                onClick={() => toggleMenu("settings")}
              >
                <i className="ri-settings-3-line" />
                <span>Settings</span>
              </Link>
              {isSidebarExpanded && activeMenu === "settings" && (
                <ul className="sub-menu mm-show">
                  <li>
                    <Link
                      className={isActive("/password") ? "active" : ""}
                      to="/password"
                      onClick={handleLinkClick}
                    >
                      Change Password
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            <li className={isActive("/aboutus") ? "mm-active" : ""}>
              <Link to="/aboutus" onClick={handleLinkClick}>
                <Info />
                <span>About Us</span>
              </Link>
            </li>

            <li className={isActive("/privacypolicy") ? "mm-active" : ""}>
              <Link to="/privacypolicy" onClick={handleLinkClick}>
                <File />
                <span>Privacy Policy</span>
              </Link>
            </li>

            <li className={isActive("/termsConditions") ? "mm-active" : ""}>
              <Link to="/termsConditions" onClick={handleLinkClick}>
                <CheckSquare />
                <span>Terms & Conditions</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
