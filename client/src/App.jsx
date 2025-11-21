import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import NoInternet from './NoInternet';
import Login from './Admin/Login';
import Dashboard from './Admin/Dashboard';
import Layout from './Admin/Common/Layout';
import PrivateRoute from './PrivateRoute';
import Profile from './Admin/Profile';
import Password from './Admin/Password';
import ContactList from './Admin/Contactus/ContactList';
import PrivacyPolicy from './Admin/Cms/PrivacyPolicy';
import AboutUs from './Admin/Cms/AboutUS';
import TermsConditions from './Admin/Cms/TermsConditions';
import FaqList from './Admin/Faq\'s/FaqList';
import FaqAdd from './Admin/Faq\'s/FaqAdd';
import FaqEdit from './Admin/Faq\'s/FaqEdit';
import BookingList from './Admin/Bookings/BookingList';
import RatingList from './Admin/Ratings/RatingList';
import UserList from './Admin/Users/UserList';
import DriverList from './Admin/Drivers/DriverList';
import ReportList from './Admin/Reports/ReportList';
import BannerList from './Admin/Banners/BannnerList';
import BannerAdd from './Admin/Banners/BannerAdd';
import BannerEdit from './Admin/Banners/BannerEdit';
import TransactionList from './Admin/Transactions/TransactionList';
import DriverDocuments from './Admin/Drivers/DriverDocuments';
import AdminBank from './Admin/AdminBank';
import ActiveBookingList from './Admin/Bookings/ActiveBookingList';
import ScreenShotList from './Admin/Transactions/ScreenShotList';
import BookingCompleted from './Admin/Bookings/BookingCompleted';
import DriverBookingList from './Admin/Drivers/DriverBookingList';


const App = () => {
  const isAuthenticated = localStorage.getItem("token");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return <NoInternet />;
  }
  return (
    <>
      <Router>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/' element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
            <Route path="/profile" element={<PrivateRoute element={<Profile />} />} />
            <Route path="/password" element={<PrivateRoute element={<Password />} />} />
            <Route path="/userlist" element={<PrivateRoute element={<UserList />} />} />
            <Route path="/driverlist" element={<PrivateRoute element={<DriverList />} />} />
            <Route path="/driverrides/:id" element={<PrivateRoute element={<DriverBookingList />} />} />
            <Route path="/contactlist" element={<PrivateRoute element={<ContactList />} />} />
            <Route path="/privacypolicy" element={<PrivateRoute element={<PrivacyPolicy />} />} />
            <Route path="/aboutus" element={<PrivateRoute element={<AboutUs />} />} />
            <Route path="/termsConditions" element={<PrivateRoute element={<TermsConditions />} />} />
            <Route path="/faqlist" element={<PrivateRoute element={<FaqList />} />} />
            <Route path="/addfaq" element={<PrivateRoute element={<FaqAdd />} />} />
            <Route path="/updatefaq/:id" element={<PrivateRoute element={<FaqEdit />} />} />
            <Route path="/ridelist" element={<PrivateRoute element={<BookingList />} />} />
            <Route path="/activeridelist" element={<PrivateRoute element={<ActiveBookingList />} />} />
            <Route path="/ratinglist" element={<PrivateRoute element={<RatingList />} />} />
            <Route path="/reportlist" element={<PrivateRoute element={<ReportList />} />} />
            <Route path="/bannerlist" element={<PrivateRoute element={<BannerList />} />} />
            <Route path="/addbanner" element={<PrivateRoute element={<BannerAdd />} />} />
            <Route path="/updatebanner/:id" element={<PrivateRoute element={<BannerEdit />} />} />
            <Route path="/transactionlist" element={<PrivateRoute element={<TransactionList />} />} />
            <Route path="/bankdetail" element={<PrivateRoute element={<AdminBank />} />} />
            <Route path="/documentlist/:driverId?" element={<PrivateRoute element={<DriverDocuments />} />} />
            <Route path="/screenshotlist" element={<PrivateRoute element={<ScreenShotList />} />} />
            <Route path="/bookingcompleted" element={<PrivateRoute element={<BookingCompleted />} />} />

          </Route>
        </Routes>

      </Router>

    </>
  )
}

export default App
