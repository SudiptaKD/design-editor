"use client"
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
        selectedShapeId : state?.selectedShapeId || null
      };
    case "REDO":
      if (state.future.length === 0) return state;
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
        selectedShapeId : state?.selectedShapeId || null
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
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <button onClick={() => addShape("rectangle")} className="bg-blue-500 text-white p-2 rounded">Add Rectangle</button>
        <button onClick={() => addShape("circle")} className="bg-green-500 text-white p-2 rounded">Add Circle</button>
        <button onClick={exportToPNG} className="bg-purple-500 text-white p-2 rounded">Download PNG</button>
        <button onClick={() => dispatch({ type: "UNDO" })} className="bg-gray-500 text-white p-2 rounded">Undo</button>
        <button onClick={() => dispatch({ type: "REDO" })} className="bg-gray-500 text-white p-2 rounded">Redo</button>
      </div>
      <div ref={canvasRef} className="relative w-[600px] h-[400px] border border-gray-300 bg-gray-100 backdrop-blur-md bg-opacity-50">
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
            <div className="flex items-center justify-center w-full h-full border cursor-pointer"
              style={{ borderRadius: shape.type === "circle" ? "50%" : "0" }}
              onClick={() => dispatch({ type: "SELECT_SHAPE", payload: shape.id })}
            >
              {shape.type}
              <button onClick={() => dispatch({ type: "DELETE_SHAPE", payload: shape.id })} className="absolute top-0 right-0 bg-red-500 text-white p-1 text-xs">X</button>
            </div>
          </Rnd>
        ))}
      </div>
    </div>
  );
}
