import { useEffect, useReducer, useRef, useCallback } from "react";
import { Rnd } from "react-rnd";
import html2canvas from "html2canvas";

// Shape types
type Shape = {
  id: string;
  type: "rectangle" | "circle";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
};

// Action types
type Action =
  | { type: "ADD_SHAPE"; payload: Shape }
  | { type: "UPDATE_SHAPE"; payload: Partial<Shape> & { id: string } }
  | { type: "DELETE_SHAPE"; payload: string }
  | { type: "LOAD_SHAPES"; payload: Shape[] }
  | { type: "CLEAR_SHAPES" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SELECT_SHAPE"; payload: string | null };

// State type
type State = {
  past: Shape[][];
  present: Shape[];
  future: Shape[][];
  selectedShapeId: string | null;
};

const initialState: State = { past: [], present: [], future: [], selectedShapeId: null };

function reducer(state: State, action: Action): State {
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

export default function DesignEditor() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedShapes = localStorage.getItem("shapes");
    if (savedShapes) {
      dispatch({ type: "LOAD_SHAPES", payload: JSON.parse(savedShapes) });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("shapes", JSON.stringify(state.present));
  }, [state.present]);

  const addShape = useCallback((type: "rectangle" | "circle") => {
    const newShape: Shape = {
      id: Date.now().toString(),
      type,
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      zIndex: state.present.length + 1,
    };
    dispatch({ type: "ADD_SHAPE", payload: newShape });
  }, [state.present]);

  const exportToPNG = async () => {
    if (canvasRef.current) {
      const canvas = await html2canvas(canvasRef.current);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "design.png";
      link.click();
    }
  };

  return (
    <div className="p-4 bg-gray-200 min-h-screen flex flex-col items-center">
      <div className="flex gap-4 bg-white p-3 rounded-lg shadow-md mb-4">
        <button onClick={() => addShape("rectangle")} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 shadow">Add Rectangle</button>
        <button onClick={() => addShape("circle")} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 shadow">Add Circle</button>
        <button onClick={exportToPNG} className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 shadow">Download PNG</button>
        <button onClick={() => dispatch({ type: "UNDO" })} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 shadow">Undo</button>
        <button onClick={() => dispatch({ type: "REDO" })} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 shadow">Redo</button>
        <button onClick={() => dispatch({ type: "CLEAR_SHAPES" })} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 shadow">Clear Canvas</button>
      </div>
      <div ref={canvasRef} className="relative w-full max-w-3xl h-[400px] border border-gray-300 bg-white rounded-md">
        {state.present.map((shape) => (
          <Rnd
            key={shape.id}
            default={{ x: shape.x, y: shape.y, width: shape.width, height: shape.height }}
            bounds="parent"
            style={{ zIndex: shape.zIndex }}
            onDragStop={(e, d) =>
              dispatch({ type: "UPDATE_SHAPE", payload: { id: shape.id, x: d.x, y: d.y } })
            }
            onResizeStop={(e, direction, ref, delta, position) =>
              dispatch({
                type: "UPDATE_SHAPE",
                payload: {
                  id: shape.id,
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height),
                  x: position.x,
                  y: position.y,
                },
              })
            }
          >
            <div className={`w-full h-full border ${shape.type === "circle" ? "rounded-full" : ""}`}>
              <button onClick={() => dispatch({ type: "DELETE_SHAPE", payload: shape.id })} className="absolute -top-3 -right-3 bg-red-500 text-white p-2 text-xs rounded-full hover:bg-red-600 shadow">X</button>
            </div>
          </Rnd>
        ))}
      </div>
    </div>
  );
}
