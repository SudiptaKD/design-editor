// reducer.ts
import { AppState, Action } from "./types";

export const initialState: AppState = { past: [], present: [], future: [], selectedShapeId: null };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_SHAPE":
      return {
        ...state,
        past: [...state.past, state.present],
        present: [...state.present, action.payload],
        future: [],
      };
    case "UPDATE_SHAPE":
      return {
        ...state,
        past: [...state.past, state.present],
        present: state.present.map((shape) =>
          shape.id === action.payload.id ? { ...shape, ...action.payload } : shape
        ),
        future: [],
      };
    case "DELETE_SHAPE":
      return {
        ...state,
        past: [...state.past, state.present],
        present: state.present.filter((shape) => shape.id !== action.payload),
        future: [],
      };
    case "LOAD_SHAPES":
      return { ...state, present: action.payload };
    case "CLEAR_SHAPES":
      return { ...state, past: [...state.past, state.present], present: [], future: [] };
    case "UNDO":
      if (state.past.length === 0) return state;
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1] || [],
        future: [state.present, ...state.future],
        selectedShapeId: state?.selectedShapeId || null,
      };
    case "REDO":
      if (state.future.length === 0) return state;
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
        selectedShapeId: state?.selectedShapeId || null,
      };
    case "SELECT_SHAPE":
      return { ...state, selectedShapeId: action.payload };
    default:
      return state;
  }
}
