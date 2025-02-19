import React from "react";

interface ShapeControlsProps {
  addShape: (type: "rectangle" | "circle") => void;
  saveDesign: () => void;
  currentDesignName: string;
  designs: string[];
  loadDesign: (designName: string) => void;
  createNewDesign: () => void;
  undo: () => void;
  redo: () => void;
  exportToPNG: () => void;
}

export const ShapeControls: React.FC<ShapeControlsProps> = ({
  addShape,
  saveDesign,
  currentDesignName,
  designs,
  loadDesign,
  createNewDesign,
  undo,
  redo,
  exportToPNG,
}) => {
  return (
    <div>
    <div className="flex gap-4 bg-white p-3 rounded-lg shadow-md mb-4">
      <button
        onClick={() => addShape("rectangle")}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 shadow"
      >
        Add Rectangle
      </button>
      <button
        onClick={() => addShape("circle")}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 shadow"
      >
        Add Circle
      </button>
      <button
        onClick={saveDesign}
        className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 shadow"
      >
        Save Design
      </button>
      <button
        onClick={createNewDesign}
        className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 shadow"
      >
        New Design
      </button>

      <button
        onClick={undo}
        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 shadow"
      >
        Undo
      </button>

      <button
        onClick={redo}
        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 shadow"
      >
        Redo
      </button>

      <button
        onClick={exportToPNG}
        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 shadow"
      >
        Export as PNG
      </button>
      </div>
      <div>
      <div className="mb-2  flex justify-center">
        <h3 className="font-semibold text-black m-1">Select a Design</h3>
        <select
          value={currentDesignName}
          onChange={(e) => loadDesign(e.target.value)}
          className="bg-white text-black p-2 border border-gray-300 rounded"
        >
          <option value="">-- Select a Design --</option>
          {designs.map((design) => (
            <option key={design} value={design}>
              {design}
            </option>
          ))}
        </select>
      </div>
    </div>
    </div>
  );
};
