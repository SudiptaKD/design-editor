import React, { useState, useEffect, useReducer, useCallback, useRef } from "react";
import { generateShape, saveToLocalStorage, loadFromLocalStorage } from "../utils/utils";
import { ShapeControls } from "./ShapeControls";
import Canvas  from "./Canvas";
import { initialState, reducer } from "../state/reducer";
import html2canvas from "html2canvas";

const DesignEditor: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [designs, setDesigns] = useState<string[]>([]);
  const [currentDesignName, setCurrentDesignName] = useState<string>("");
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedDesigns = localStorage.getItem("designs");
    if (savedDesigns) {
      const designsObj = JSON.parse(savedDesigns);
      setDesigns(Object.keys(designsObj));
      const latestDesignName = Object.keys(designsObj)[0];
      setCurrentDesignName(latestDesignName);
      dispatch({ type: "LOAD_SHAPES", payload: designsObj[latestDesignName] });
    }
  }, []);

  useEffect(() => {
    if (currentDesignName) {
      saveToLocalStorage(currentDesignName, state.present);
      setDesigns(Object.keys(JSON.parse(localStorage.getItem("designs") || "{}")));
    }
  }, [state.present, currentDesignName]);

  const addShape = useCallback((type: "rectangle" | "circle") => {
    const newShape = generateShape(type);
    dispatch({ type: "ADD_SHAPE", payload: newShape });
  }, []);

  const saveDesign = () => {
    if (currentDesignName) {
      saveToLocalStorage(currentDesignName, state.present);
    } else {
      const designName = prompt("Enter a name for your design:");
      if (designName) {
        saveToLocalStorage(designName, state.present);
        setDesigns(Object.keys(JSON.parse(localStorage.getItem("designs") || "{}")));
        setCurrentDesignName(designName);
      }
    }
  };

  const loadDesign = (designName: string) => {
    const shapes = loadFromLocalStorage(designName);
    setCurrentDesignName(designName);
    dispatch({ type: "LOAD_SHAPES", payload: shapes });
  };

  const createNewDesign = () => {
    dispatch({ type: "CLEAR_SHAPES" });
    setCurrentDesignName("");
  };

  const undo = () => {
    dispatch({ type: "UNDO" });
  };

  const redo = () => {
    dispatch({ type: "REDO" });
  };

  const exportToPNG = async () => {
    if (canvasRef.current) {
      const canvas = await html2canvas(canvasRef.current, {
        ignoreElements: (element) => element.classList.contains("delete-btn"),
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "design.png";
      link.click();
    }
  };

  return (
    <div className="p-4 bg-gray-200 min-h-screen flex flex-col items-center">
      <ShapeControls
        addShape={addShape}
        saveDesign={saveDesign}
        currentDesignName={currentDesignName}
        designs={designs}
        loadDesign={loadDesign}
        createNewDesign={createNewDesign}
        undo={undo}
        redo={redo}
        exportToPNG={exportToPNG}
      />
      <Canvas state={state} dispatch={dispatch} canvasRef={canvasRef} />
    </div>
  );
};

export default DesignEditor;
