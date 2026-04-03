export const getFontWeight = (weight) => {
  switch (weight) {
    case "normal":
      return 400;
    case "semibold":
      return 600;
    case "bold":
      return 700;
    default:
      return 400;
  }
};

export const getHeadingSize = (heading) => {
  switch (heading) {
    case "h2":
      return "24px";
    case "h3":
      return "20px";
    case "h4":
      return "16px";
    default:
      return "16px";
  }
};

export const getIconSize = (size) => {
  switch (size) {
    case "small":
      return "14px";
    case "medium":
      return "18px";
    case "large":
      return "22px";
    default:
      return "18px";
  }
};

export const getBorderWidth = (type) => {
  switch (type) {
    case "thin":
      return "1px";
    case "normal":
      return "2px";
    case "thick":
      return "3px";
    default:
      return "0px";
  }
};