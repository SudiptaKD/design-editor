import { Shape } from "../state/types";

// Generate a new shape with default values
export const generateShape = (type: "rectangle" | "circle"): Shape => {
  return {
    id: Date.now().toString(),
    type,
    x: 50,
    y: 50,
    width: 100,
    height: 100,
    zIndex: 1,
  };
};

// Save the design to local storage
export const saveToLocalStorage = (designName: string, shapes: Shape[]) => {
  const savedDesigns = JSON.parse(localStorage.getItem("designs") || "{}");
  savedDesigns[designName] = shapes;
  localStorage.setItem("designs", JSON.stringify(savedDesigns));
};

// Load the design from local storage
export const loadFromLocalStorage = (designName: string) => {
  const savedDesigns = JSON.parse(localStorage.getItem("designs") || "{}");
  return savedDesigns[designName] || [];
};
