import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { EdgeCloudT } from "../types";

// Define the initial state using that type
const initialState: EdgeCloudT = {
  ingestorId: "",
  streamServer: "",
  streamKey: "",
};

export const EdgeCloudSlice = createSlice({
  name: "edgeCloud",
  initialState,
  reducers: {
    addIngestor: (state, { payload }: PayloadAction<string>) => {
      state.ingestorId = payload;
    },
    addStreamServer: (state, { payload }: PayloadAction<string>) => {
      state.streamServer = payload;
    },
    addStreamKey: (state, { payload }: PayloadAction<string>) => {
      state.streamKey = payload;
    },
  },
});

export const { addIngestor, addStreamServer, addStreamKey } =
  EdgeCloudSlice.actions;

export default EdgeCloudSlice.reducer;
