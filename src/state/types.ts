export type Shape = {
    id: string;
    type: "rectangle" | "circle";
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
  };
  
  export type AppState = {
    past: Shape[][];
    present: Shape[];
    future: Shape[][];
    selectedShapeId: string | null;
  };
  
  export type Action =
    | { type: "ADD_SHAPE"; payload: Shape }
    | { type: "UPDATE_SHAPE"; payload: Shape }
    | { type: "DELETE_SHAPE"; payload: string }
    | { type: "LOAD_SHAPES"; payload: Shape[] }
    | { type: "CLEAR_SHAPES" }
    | { type: "UNDO" }
    | { type: "REDO" }
    | { type: "SELECT_SHAPE"; payload: string };
  