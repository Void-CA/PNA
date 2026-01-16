import { bindFileInput } from "./ui/bindFileInput";

const input = document.querySelector<HTMLInputElement>("#file")!;
bindFileInput(input);
