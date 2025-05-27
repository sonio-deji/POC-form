export const fields = [
  {
    title: "email",
    type: "email",
    options: [""],
    required: true,
  },
  {
    title: "name",
    type: "text",
    options: [""],
    required: true,
  },
  {
    title: "message",
    type: "text",
    options: [""],
    required: true,
  },
];

export const generateRandomNumber = (length: number) => {
  if (length <= 0) {
    throw new Error("Length must be a positive integer");
  }

  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;

  return String(Math.floor(Math.random() * (max - min + 1)) + min);
};
