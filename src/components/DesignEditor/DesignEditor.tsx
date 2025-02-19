import { useReducer, useEffect, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { Rnd } from "react-rnd";

// Types
type Shape = {
  id: string;
  type: "rectangle" | "circle";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  color: string;
  borderStyle: string;
  borderWidth: number;
  rotation: number;
  text: string;
};

type Action =
  | { type: "ADD_SHAPE"; payload: Shape }
  | { type: "UPDATE_SHAPE"; payload: Partial<Shape> & { id: string } }
  | { type: "DELETE_SHAPE"; payload: string }
  | { type: "LOAD_SHAPES"; payload: Shape[] }
  | { type: "CLEAR_SHAPES" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SELECT_SHAPE"; payload: string | null };

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
      color: "#000000",
      borderStyle: "solid",
      borderWidth: 2,
      rotation: 0,
      text: "",
    };
    dispatch({ type: "ADD_SHAPE", payload: newShape });
  }, [state.present]);

  const updateShape = (id: string, updatedProperties: Partial<Shape>) => {
    dispatch({ type: "UPDATE_SHAPE", payload: { id, ...updatedProperties } });
  };

  const exportToPNG = async () => {
    if (canvasRef.current) {
      const canvas = await html2canvas(canvasRef.current);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "design.png";
      link.click();
    }
  };

  const exportToSVG = () => {
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
        ${state.present.map((shape) => `
          <${shape.type === "rectangle" ? "rect" : "circle"}
            x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}"
            fill="${shape.color}" stroke="black" stroke-width="${shape.borderWidth}"
            transform="rotate(${shape.rotation} ${shape.x + shape.width / 2} ${shape.y + shape.height / 2})"
          />
        `).join('')}
      </svg>`;

    const link = document.createElement("a");
    link.href = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgContent);
    link.download = "design.svg";
    link.click();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Design Editor</h1>
      <div className="flex gap-4 mb-4">
        <button onClick={() => addShape("rectangle")} className="bg-blue-500 text-white p-2 rounded">Add Rectangle</button>
        <button onClick={() => addShape("circle")} className="bg-green-500 text-white p-2 rounded">Add Circle</button>
        <button onClick={exportToPNG} className="bg-purple-500 text-white p-2 rounded">Export PNG</button>
        <button onClick={exportToSVG} className="bg-gray-500 text-white p-2 rounded">Export SVG</button>
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
              updateShape(shape.id, { x: d.x, y: d.y })
            }
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
              className="flex items-center justify-center w-full h-full cursor-pointer text-center"
              style={{
                backgroundColor: shape.color,
                borderRadius: shape.type === "circle" ? "50%" : "0",
                border: `${shape.borderWidth}px ${shape.borderStyle} black`,
                transform: `rotate(${shape.rotation}deg)`,
              }}
              onClick={() => dispatch({ type: "SELECT_SHAPE", payload: shape.id })}
            >
              {shape.text || shape.type}
              <button onClick={() => dispatch({ type: "DELETE_SHAPE", payload: shape.id })} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs">X</button>
            </div>
          </Rnd>
        ))}
      </div>
    </div>
  );
}
