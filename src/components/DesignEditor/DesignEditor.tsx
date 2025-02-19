import { useReducer, useEffect, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { Rnd } from "react-rnd";

type Shape = {
  id: string;
  type: "rectangle" | "circle";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  color: string;
  rotation: number;
};

type Action =
  | { type: "ADD_SHAPE"; payload: Shape }
  | { type: "UPDATE_SHAPE"; payload: Partial<Shape> & { id: string } }
  | { type: "DELETE_SHAPE"; payload: string }
  | { type: "LOAD_SHAPES"; payload: Shape[] }
  | { type: "UNDO" }
  | { type: "REDO" };

type State = {
  past: Shape[][];
  present: Shape[];
  future: Shape[][];
};

const initialState: State = { past: [], present: [], future: [] };

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
    case "UNDO":
      if (state.past.length === 0) return state;
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1] || [],
        future: [state.present, ...state.future],
      };
    case "REDO":
      if (state.future.length === 0) return state;
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
      };
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
    const size = type === "circle" ? 100 : 120;
    const newShape: Shape = {
      id: Date.now().toString(),
      type,
      x: 50,
      y: 50,
      width: size,
      height: type === "circle" ? size : 80,
      zIndex: state.present.length + 1,
      color: "#3498db",
      rotation: 0,
    };
    dispatch({ type: "ADD_SHAPE", payload: newShape });
  }, [state.present]);

  const updateShape = (id: string, updatedProperties: Partial<Shape>) => {
    dispatch({ type: "UPDATE_SHAPE", payload: { id, ...updatedProperties } });
  };

  const exportToPNG = async () => {
    if (canvasRef.current) {
      const crossButtons = canvasRef.current.querySelectorAll(".delete-btn");
      crossButtons.forEach((btn) => (btn as HTMLElement).style.display = "none")

      const canvas = await html2canvas(canvasRef.current);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "design.png";
      link.click();

      crossButtons.forEach((btn) => (btn as HTMLElement).style.display = "block")
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-4">Design Editor</h1>

      {/* 🚀 Styled Toolbar */}
      <div className="flex flex-wrap justify-center gap-3 mb-4 p-3 bg-gray-800 rounded-lg shadow-lg">
        <button onClick={() => addShape("rectangle")} className="btn">Rectangle</button>
        <button onClick={() => addShape("circle")} className="btn">Circle</button>
        <button onClick={exportToPNG} className="btn bg-blue-600">Export PNG</button>
        <button onClick={() => dispatch({ type: "UNDO" })} className="btn bg-gray-500">Undo</button>
        <button onClick={() => dispatch({ type: "REDO" })} className="btn bg-gray-500">Redo</button>
      </div>

      {/* 🎨 Canvas */}
      <div ref={canvasRef} className="relative w-full max-w-3xl h-[400px] mx-auto border-2 border-gray-400 bg-gray-100 rounded-lg shadow-md overflow-hidden">
        {state.present.map((shape) => (
          <Rnd
            key={shape.id}
            default={{ x: shape.x, y: shape.y, width: shape.width, height: shape.height }}
            bounds="parent"
            style={{ zIndex: shape.zIndex }}
            onDragStop={(e, d) => updateShape(shape.id, { x: d.x, y: d.y })}
            onResizeStop={(e, direction, ref, delta, position) =>
              updateShape(shape.id, {
                width: parseInt(ref.style.width),
                height: parseInt(ref.style.height),
                x: position.x,
                y: position.y,
              })
            }
          >
            <div
              className="relative flex items-center justify-center w-full h-full"
              style={{
                backgroundColor: shape.color,
                borderRadius: shape.type === "circle" ? "50%" : "0",
                transform: `rotate(${shape.rotation}deg)`,
              }}
            >
              {/* Larger Cross Button for Easy Click */}
              <button
                className="delete-btn absolute -top-3 -right-3 bg-red-600 text-white text-sm px-2 py-1 rounded-full shadow-md hover:bg-red-700"
                onClick={() => dispatch({ type: "DELETE_SHAPE", payload: shape.id })}
              >
                ❌
              </button>
            </div>
          </Rnd>
        ))}
      </div>

      {/* 🚀 Tailwind CSS for Buttons */}
      <style jsx>{`
        .btn {
          background-color: #4a5568;
          color: white;
          padding: 10px 15px;
          border-radius: 8px;
          font-weight: bold;
          transition: all 0.2s ease-in-out;
          box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
        }
        .btn:hover {
          background-color: #2d3748;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
