import { configureStore } from '@reduxjs/toolkit';
import userReducer from './UserSlice';
import lenderReducer from './DriverSlice';



const store = configureStore({
  reducer: {
    users: userReducer,
    lenders: lenderReducer,
  },
});

export default store;
