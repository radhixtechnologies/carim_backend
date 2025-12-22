import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  Book,
  CheckSquare,
  DollarSign,
  File,
  Image,
  Info,
  Star,
} from "react-feather";

function Sidebar({ isOpen }) {
  const [isHovered, setHovered] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showButton, setShowButton] = useState(true);
  const location = useLocation();
  const { pathname } = location;

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
      pathname.startsWith("/driverrides") ||
      pathname.startsWith("/documentlist") ||
      pathname.startsWith("/updatetutorial")
    ) {
      setActiveMenu("seekers");
    } else if (
      pathname === "/bannerlist" ||
      pathname.startsWith("/bannerlist") ||
      pathname.startsWith("/addbanner") ||
      pathname.startsWith("/updatebanner")
    ) {
      setActiveMenu("banner");
    } else if (pathname === "/teamlist") {
      setActiveMenu("teamManagement");
    } else if (
      pathname === "/ridelist" ||
      pathname.startsWith("/activeridelist")
    ) {
      setActiveMenu("booking");
    } else if (
      pathname === "/screenshotlist" ||
      pathname === "/bookingcompleted"
    ) {
      setActiveMenu("transaction");
    } else if (pathname === "/requestlist") {
      setActiveMenu("request");
    } else if (pathname === "/ratinglist") {
      setActiveMenu("rating");
    } else if (pathname === "/reportlist") {
      setActiveMenu("report");
    } else if (pathname === "/leaguelist") {
      setActiveMenu("league");
    } else if (pathname === "/bannerlist") {
      setActiveMenu("banner");
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
            <img src="/assets/images/carim1.png" alt="" height={20} />
          </span>
        </Link>
        {/* <button
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
        </button> */}
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
                      className={isActive("/documentlist") ? "active" : ""}
                      to="/documentlist"
                      onClick={handleLinkClick}
                    >
                      Document listings
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
                <span>Rides</span>
              </Link>
              {isSidebarExpanded && activeMenu === "booking" && (
                <ul className="sub-menu mm-show">
                  <li>
                    <Link
                      className={isActive("/ridelist") ? "active" : ""}
                      to="/ridelist"
                      onClick={handleLinkClick}
                    >
                      Ride list
                    </Link>
                  </li>
                  <li>
                    <Link
                      className={isActive("/activeridelist") ? "active" : ""}
                      to="/activeridelist"
                      onClick={handleLinkClick}
                    >
                      Active Ride list
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li className={activeMenu === "transaction" ? "mm-active" : ""}>
              <Link
                className="has-arrow waves-effect"
                onClick={() => toggleMenu("transaction")}
              >
                <DollarSign />
                <span>Transactions</span>
              </Link>
              {isSidebarExpanded && activeMenu === "transaction" && (
                <ul className="sub-menu mm-show">
                  <li>
                    <Link
                      className={isActive("/bookingcompleted") ? "active" : ""}
                      to="/bookingcompleted"
                      onClick={handleLinkClick}
                    >
                      Transaction list
                    </Link>
                  </li>
                  {/* <li>
                    <Link
                      className={isActive("/transactionlist") ? "active" : ""}
                      to="/transactionlist"
                      onClick={handleLinkClick}
                    >
                      Transaction list
                    </Link>
                  </li> */}
                  <li>
                    <Link
                      className={isActive("/screenshotlist") ? "active" : ""}
                      to="/screenshotlist"
                      onClick={handleLinkClick}
                    >
                      Transaction Proof list
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
            <li className={activeMenu === "report" ? "mm-active" : ""}>
              <Link
                className="has-arrow waves-effect"
                onClick={() => toggleMenu("report")}
              >
                <Activity />
                <span>Reports</span>
              </Link>
              {isSidebarExpanded && activeMenu === "report" && (
                <ul className="sub-menu mm-show">
                  <li>
                    <Link
                      className={isActive("/reportlist") ? "active" : ""}
                      to="/reportlist"
                      onClick={handleLinkClick}
                    >
                      Report list
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li className={activeMenu === "banner" ? "mm-active" : ""}>
              <Link
                className="has-arrow waves-effect"
                onClick={() => toggleMenu("banner")}
              >
                <Image />
                <span>Banners</span>
              </Link>
              {isSidebarExpanded && activeMenu === "banner" && (
                <ul className="sub-menu mm-show">
                  <li>
                    <Link
                      className={isActive("/bannerlist") ? "active" : ""}
                      to="/bannerlist"
                      onClick={handleLinkClick}
                    >
                      Banner list
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
