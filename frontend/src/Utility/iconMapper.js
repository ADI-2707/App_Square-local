import recipeIcon from "../assets/icons/recipe.svg";
import templateIcon from "../assets/icons/template.svg";
import areaIcon from "../assets/icons/area.svg";
import deviceIcon from "../assets/icons/device.svg";

export const ICONS = {
  recipe: recipeIcon,
  template: templateIcon,
  area: areaIcon,
  device: deviceIcon,
};

export const getIcon = (type) => {
  return ICONS[type] || null;
};