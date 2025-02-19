import { useEffect, useReducer, useRef, useCallback, useMemo, useState } from "react";
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

const DesignEditor = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [designs, setDesigns] = useState<string[]>([]); // List of saved design names
  const [currentDesignName, setCurrentDesignName] = useState<string>(""); // Name of the current design
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load saved designs from localStorage
  useEffect(() => {
    const savedDesigns = localStorage.getItem("designs");
    if (savedDesigns) {
      const designsObj = JSON.parse(savedDesigns);
      setDesigns(Object.keys(designsObj)); // Get list of design names
      const latestDesignName = Object.keys(designsObj)[0]; // Load the latest design
      setCurrentDesignName(latestDesignName);
      dispatch({ type: "LOAD_SHAPES", payload: designsObj[latestDesignName] });
    }
  }, []);

  // Save current design to localStorage
  useEffect(() => {
    if (currentDesignName) {
      const savedDesigns = JSON.parse(localStorage.getItem("designs") || "{}");
      savedDesigns[currentDesignName] = state.present;
      localStorage.setItem("designs", JSON.stringify(savedDesigns));
      setDesigns(Object.keys(savedDesigns)); // Update the design list
    }
  }, [state.present, currentDesignName]);

  // Add new shape function
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

  // Export canvas as PNG without delete buttons
  const exportToPNG = async () => {
    if (canvasRef.current) {
      const canvas = await html2canvas(canvasRef.current, {
        ignoreElements: (element) => element.classList.contains("delete-btn"), // Ignore delete buttons
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "design.png";
      link.click();
    }
  };

  // Memoize rendered shapes to optimize performance
  const renderedShapes = useMemo(() => {
    return state.present.map((shape) => (
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
              width: shape.type === "circle" ? Math.min(parseInt(ref.style.width), parseInt(ref.style.height)) : parseInt(ref.style.width),
              height: shape.type === "circle" ? Math.min(parseInt(ref.style.width), parseInt(ref.style.height)) : parseInt(ref.style.height),
              x: position.x,
              y: position.y,
            },
          })
        }
      >
        <div
          className={`w-full h-full border ${shape.type === "circle" ? "rounded-full" : ""}`}
        >
          <button
            onClick={() => dispatch({ type: "DELETE_SHAPE", payload: shape.id })}
            className="delete-btn absolute -top-3 -right-3 bg-red-500 text-white p-2 text-xs rounded-full hover:bg-red-600 shadow"
          >
            X
          </button>
        </div>
      </Rnd>
    ));
  }, [state.present, dispatch]);

  // Save the design under a name
  const saveDesign = () => {
    if (currentDesignName) {
      // Overwrite the current design if it already exists
      const savedDesigns = JSON.parse(localStorage.getItem("designs") || "{}");
      savedDesigns[currentDesignName] = state.present; // Save current state under the name
      localStorage.setItem("designs", JSON.stringify(savedDesigns));
      setDesigns(Object.keys(savedDesigns)); // Update design list
    } else {
      // Prompt user for a new design name if it's a new design
      const designName = prompt("Enter a name for your design:");
      if (designName) {
        const savedDesigns = JSON.parse(localStorage.getItem("designs") || "{}");
        savedDesigns[designName] = state.present; // Save current state under the name
        localStorage.setItem("designs", JSON.stringify(savedDesigns));
        setDesigns(Object.keys(savedDesigns)); // Update design list
        setCurrentDesignName(designName); // Set as current design
      }
    }
  };

  // Load a saved design by name
  const loadDesign = (designName: string) => {
    const savedDesigns = JSON.parse(localStorage.getItem("designs") || "{}");
    const shapes = savedDesigns[designName];
    setCurrentDesignName(designName); // Set the current design name
    dispatch({ type: "LOAD_SHAPES", payload: shapes }); // Load the shapes of the selected design
  };

  // Start a new empty design
  const createNewDesign = () => {
    dispatch({ type: "CLEAR_SHAPES" });
    setCurrentDesignName(""); // Reset the current design name
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
        <button onClick={createNewDesign} className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 shadow">New Design</button>
        <button onClick={saveDesign} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 shadow">Save Design</button>
      </div>
      <div className="mb-4">
        <h3 className="font-semibold">Select a Design</h3>
        <select
          value={currentDesignName}
          onChange={(e) => loadDesign(e.target.value)}
          className="bg-white p-2 border border-gray-300 rounded"
        >
          <option value="">-- Select a Design --</option>
          {designs.map((design) => (
            <option key={design} value={design}>
              {design}
            </option>
          ))}
        </select>
      </div>
      <div ref={canvasRef} className="relative w-full max-w-3xl h-[400px] border border-gray-300 bg-white rounded-md overflow-hidden">
        {renderedShapes}
      </div>
    </div>
  );
};

export default DesignEditor;
