import { configureStore } from "@reduxjs/toolkit";
import edgeCloud from "./slice/EdgeCloudSlice";

export const store = configureStore({
  reducer: {
    edgeCloud,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
