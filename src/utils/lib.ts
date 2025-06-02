export const fields: {
  title: string;
  type:
    | "text"
    | "number"
    | "date"
    | "dropdown"
    | "checkbox"
    | "email"
    | "textarea";
  options: string[];
  required: boolean;
  placeholder: string;
}[] = [
  {
    title: "email",
    type: "email",
    options: [""],
    required: true,
    placeholder: "Enter your email",
  },
  {
    title: "name",
    type: "text",
    options: [""],
    required: true,
    placeholder: "Enter your name",
  },
  {
    title: "message",
    type: "text",
    options: [""],
    required: true,
    placeholder: "Enter your message",
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
