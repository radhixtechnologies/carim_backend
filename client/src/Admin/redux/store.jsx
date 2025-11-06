import { configureStore } from '@reduxjs/toolkit';
import userReducer from './PlayerSlice';
import lenderReducer from './DriverSlice';



const store = configureStore({
  reducer: {
    users: userReducer,
    lenders: lenderReducer,
  },
});

export default store;
