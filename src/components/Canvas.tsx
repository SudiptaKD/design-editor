import React, { useMemo } from "react";
import { Rnd } from "react-rnd";

interface Shape {
  id: string;
  type: "rectangle" | "circle";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

interface CanvasProps {
  state: any;
  dispatch: React.Dispatch<any>;
  canvasRef : any
}

const Canvas: React.FC<CanvasProps> = ({ state, dispatch, canvasRef }) => {
  // Memoize rendered shapes to optimize performance
  const renderedShapes = useMemo(() => {
    return state.present.map((shape: Shape) => (
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

  return (
    <div ref={canvasRef} className="relative w-full max-w-3xl h-[400px] border border-gray-300 bg-white rounded-md overflow-hidden">
      {renderedShapes}
    </div>
  );
};

export default Canvas;
